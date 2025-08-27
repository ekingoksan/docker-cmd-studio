import Sidebar from "@/components/Sidebar";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto p-8 bg-gray-100">
        {children}
      </main>
    </div>
  );
}