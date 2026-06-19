"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
      style={{ color: "#9aa7ba" }}
    >
      <ArrowLeft size={16} />
      Voltar
    </button>
  );
}
