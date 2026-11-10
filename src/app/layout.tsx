import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control de diners",
  description: "Finances personals: balanç, ingressos, despeses, accions i pressupostos.",
  appleWebApp: { capable: true, title: "Diners", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ca" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
