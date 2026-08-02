import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cek DPT | Pilkel Desa Pikat 2026",
  description: "Cek lokasi TPS Pemilihan Perbekel Desa Pikat 2026 berdasarkan NIK. Sistem resmi Panitia Pilkel Desa Pikat, Kecamatan Dawan, Kabupaten Klungkung, Bali.",
};

// Inline script to prevent flash of wrong theme before React hydrates
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var isDark = stored === 'dark' ||
        (!stored || stored === 'system') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`h-full antialiased ${inter.variable}`} suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
