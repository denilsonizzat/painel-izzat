"use client";
import Sidebar from "./Sidebar";
import BreadcrumbNav from "./BreadcrumbNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 md:p-6 p-4 pt-16 md:pt-6 overflow-auto">
        <BreadcrumbNav />
        {children}
      </main>
    </div>
  );
}
