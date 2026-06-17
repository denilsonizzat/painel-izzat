"use client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppShell from "@/components/AppShell";

export default function CustoTotalLayout({ children }: { children: React.ReactNode }) {
  const { usuarioAtual } = useAppStore();
  const router = useRouter();
  useEffect(() => {
    if (!usuarioAtual) { router.push("/"); return; }
    if (usuarioAtual.nivelAcesso !== "admin") router.push("/dashboard");
  }, [usuarioAtual, router]);
  if (!usuarioAtual || usuarioAtual.nivelAcesso !== "admin") return null;
  return <AppShell>{children}</AppShell>;
}
