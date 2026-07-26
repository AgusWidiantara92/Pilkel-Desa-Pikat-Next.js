import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-gray-100 selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
