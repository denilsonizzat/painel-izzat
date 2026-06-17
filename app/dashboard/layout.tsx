"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import AppShell from "@/components/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuarioAtual } = useAppStore();
  const router = useRouter();
  useEffect(() => {
    if (!usuarioAtual) router.push("/");
  }, [usuarioAtual, router]);
  if (!usuarioAtual) return null;
  return <AppShell>{children}</AppShell>;
}
