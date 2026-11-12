import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Panell de vida",
    short_name: "Panell",
    description: "El teu dia i la teva vida en una pantalla: agenda, prioritats, hàbits, objectius i diners.",
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
