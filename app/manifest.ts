import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Painel Izzat Group",
    short_name: "Izzat",
    description: "Gestao de equipe e lojas — Izzat Group",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A1626",
    theme_color: "#C9A442",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/lojas/izzat-group.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    categories: ["business", "productivity"],
    shortcuts: [
      { name: "Meu Dia", short_name: "Hoje", description: "Ver rotinas do dia", url: "/meu-dia" },
      { name: "Tarefas", short_name: "Tarefas", description: "Ver minhas tarefas", url: "/tarefas" },
    ],
  };
}
