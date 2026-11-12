import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panell de vida",
  description: "El teu dia i la teva vida en una pantalla: agenda, prioritats, hàbits, objectius i diners.",
  appleWebApp: { capable: true, title: "Panell", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#14100e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ca" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
