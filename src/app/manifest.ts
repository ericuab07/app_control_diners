import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Control de diners",
    short_name: "Diners",
    description: "Finances personals: balanç, ingressos, despeses, accions i pressupostos.",
    start_url: "/",
    display: "standalone",
    background_color: "#14100e",
    theme_color: "#d97757",
    lang: "ca",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
