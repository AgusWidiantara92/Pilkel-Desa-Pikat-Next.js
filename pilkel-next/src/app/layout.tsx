import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cek DPT — Pilkel Desa Pikat 2026",
  description: "Cek lokasi TPS Pemilihan Perbekel Desa Pikat 2026 berdasarkan NIK. Sistem resmi Panitia Pilkel Desa Pikat, Kecamatan Dawan, Kabupaten Klungkung, Bali.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full flex flex-col font-sans bg-gray-100 selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
