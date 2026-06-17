import type { Metadata } from "next";
import Providers from "./components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operix",
  description: "Business OS",
};

const themeScript = `
(function () {
  try {
    var theme = localStorage.getItem('operix_theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
