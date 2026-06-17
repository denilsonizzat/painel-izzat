import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Painel Izzat Group",
    short_name: "Izzat",
    description: "Gestao de equipe e lojas — Izzat Group",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1624",
    theme_color: "#c9a84c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable"},
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"},
    ],
    categories: ["business", "productivity"],
    shortcuts: [
      { name: "Meu Dia", short_name: "Hoje", description: "Ver rotinas do dia", url: "/meu-dia" },
      { name: "Tarefas", short_name: "Tarefas", description: "Ver minhas tarefas", url: "/tarefas" },
    ],
  };
}
