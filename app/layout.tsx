import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TugasKu — Buat Tugasan, Kumpul Ganjaran & Naikkan Engagement",
  description:
    "Platform komuniti Malaysia: selesaikan tugasan ringkas untuk ganjaran tunai, atau naikkan engagement sosial anda dengan pengguna sebenar.",
};

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
