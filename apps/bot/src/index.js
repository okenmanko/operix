require('dotenv').config();
const axios = require('axios');
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const API = process.env.OPERIX_API_URL || 'http://localhost:4000';
const SECRET = process.env.OPERIX_BOT_SECRET || 'change_me';

const api = axios.create({ baseURL: API, headers: { 'x-operix-bot-secret': SECRET } });

function mainKeyboard() {
  return Markup.keyboard([
    ['🏠 Dashboard', '👥 Mijozlar'],
    ['💰 Qarzlar', '💵 To‘lov kiritish'],
    ['🚚 Delivery', '📊 Hisobotlar'],
    ['⚙️ Sozlamalar']
  ]).resize();
}

async function getSession(ctx) {
  const telegramId = String(ctx.from.id);
  const { data } = await api.post('/telegram-bot/session', {
    telegramId,
    fullName: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ')
  });
  return data;
}

bot.start(async (ctx) => {
  const session = await getSession(ctx);
  if (!session.companyId) {
    return ctx.reply('Operix botga xush kelibsiz. Kompaniya kodini yuboring. Masalan: OPX-DIGI', Markup.removeKeyboard());
  }
  return ctx.reply('Operix kabinet tayyor.', mainKeyboard());
});

bot.hears(/^OPX-/i, async (ctx) => {
  try {
    const { data } = await api.post('/telegram-bot/bind-company', {
      telegramId: String(ctx.from.id),
      code: ctx.message.text.trim(),
      fullName: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ')
    });
    return ctx.reply(`✅ Bog‘landi: ${data.company.name}`, mainKeyboard());
  } catch (e) {
    return ctx.reply('Kod topilmadi yoki kompaniya bloklangan.');
  }
});

bot.hears('🏠 Dashboard', async (ctx) => {
  const s = await getSession(ctx);
  const { data } = await api.get(`/telegram-bot/dashboard/${s.companyId}`);
  return ctx.reply([
    '📊 OPERIX DASHBOARD', '',
    `👥 Mijozlar: ${data.clientsCount}`,
    `💰 UZS qoldiq: ${Number(data.remainingUZS || 0).toLocaleString('ru-RU')} UZS`,
    `💵 USD qoldiq: ${Number(data.remainingUSD || 0).toLocaleString('ru-RU')} USD`,
    `⚠️ Kechikkanlar: ${data.overdueDebtsCount}`
  ].join('\n'));
});

bot.hears('💰 Qarzlar', async (ctx) => {
  const s = await getSession(ctx);
  const { data } = await api.get(`/telegram-bot/debts/${s.companyId}`);
  if (!data.length) return ctx.reply('Qarzlar yo‘q.');
  const text = data.slice(0, 10).map((d, i) => `${i + 1}. ${d.client.fullName}\n${Number(d.remainingAmount).toLocaleString('ru-RU')} ${d.currency}\n📞 ${d.client.phone}`).join('\n\n');
  return ctx.reply(text);
});

bot.hears('🚚 Delivery', async (ctx) => {
  const s = await getSession(ctx);
  const { data } = await api.get(`/telegram-bot/delivery/${s.companyId}`);
  if (!data.length) return ctx.reply('Delivery buyurtmalar yo‘q.');
  const buttons = data.slice(0, 8).map(o => [Markup.button.callback(`${o.orderNumber || o.id.slice(0, 6)} • ${o.clientName}`, `delivery:${o.id}`)]);
  return ctx.reply('Delivery buyurtmalar:', Markup.inlineKeyboard(buttons));
});

bot.action(/^delivery:(.+)/, async (ctx) => {
  const id = ctx.match[1];
  await ctx.answerCbQuery();
  return ctx.reply('Status tanlang:', Markup.inlineKeyboard([
    [Markup.button.callback('📦 Yig‘ildi', `dst:${id}:COLLECTED`), Markup.button.callback('✅ Yetkazildi', `dst:${id}:DELIVERED`)],
    [Markup.button.callback('❌ Bekor', `dst:${id}:CANCELLED`)]
  ]));
});

bot.action(/^dst:(.+):(.+)/, async (ctx) => {
  const [, id, status] = ctx.match;
  await api.patch(`/telegram-bot/delivery/${id}/status`, { status });
  await ctx.answerCbQuery('Status yangilandi');
  return ctx.reply(`✅ Delivery status: ${status}`);
});

bot.hears('📊 Hisobotlar', async (ctx) => {
  const s = await getSession(ctx);
  const { data } = await api.get(`/telegram-bot/dashboard/${s.companyId}`);
  return ctx.reply(`📊 Hisobot\nBugungi UZS: ${Number(data.todayPaymentsUZS || 0).toLocaleString('ru-RU')}\nBugungi USD: ${Number(data.todayPaymentsUSD || 0).toLocaleString('ru-RU')}`);
});

bot.catch((err) => console.error('BOT ERROR', err));
bot.launch().then(() => console.log('Operix bot started'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
