import Sidebar from "../components/Sidebar";

export default function ClientsPage() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold">
          Clients
        </h1>
      </main>
    </div>
  );
}