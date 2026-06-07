export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-3xl font-bold mb-6">
          Operix CRM
        </h1>

        <input
          placeholder="Email"
          className="w-full border p-3 rounded mb-3"
        />

        <input
          type="password"
          placeholder="Parol"
          className="w-full border p-3 rounded mb-4"
        />

        <button
          className="w-full bg-black text-white p-3 rounded"
        >
          Kirish
        </button>
      </div>
    </div>
  );
}