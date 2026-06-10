import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operix",
  description: "Business OS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
