import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestão e-commerce - Izzat",
    short_name: "Grupo Izzat",
    description: "Gestão de e-commerce e lojas — Grupo Izzat",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A1626",
    theme_color: "#C9A442",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["business", "productivity"],
    shortcuts: [
      { name: "Meu Dia", short_name: "Hoje", description: "Ver rotinas do dia", url: "/meu-dia" },
      { name: "Tarefas", short_name: "Tarefas", description: "Ver minhas tarefas", url: "/tarefas" },
    ],
  };
}
