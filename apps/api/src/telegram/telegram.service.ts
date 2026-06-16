import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramService {
  safe(value: any) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  money(amount: number, currency = 'UZS') {
    return `${Number(amount || 0).toLocaleString('ru-RU')} ${currency}`;
  }

  async sendMessage(text: string) {
    console.log('[Telegram disabled]', text);
    return true;
  }

  async sendNewDebtNotification(data: any) {
    console.log('[Telegram debt disabled]', data);
    return true;
  }

  async sendPaymentNotification(data: any) {
    console.log('[Telegram payment disabled]', data);
    return true;
  }
}