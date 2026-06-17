"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import LoginPage from "@/components/LoginPage";

export default function Home() {
  const { usuarioAtual } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (usuarioAtual) {
      router.push("/dashboard");
    }
  }, [usuarioAtual, router]);

  return <LoginPage />;
}
