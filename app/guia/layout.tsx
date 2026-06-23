"use client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppShell from "@/components/AppShell";

export default function GuiaLayout({ children }: { children: React.ReactNode }) {
  const { usuarioAtual } = useAppStore();
  const router = useRouter();
  useEffect(() => {
    if (!usuarioAtual) router.push("/");
  }, [usuarioAtual, router]);
  if (!usuarioAtual) return null;
  return <AppShell>{children}</AppShell>;
}
