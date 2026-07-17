import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://peningtask-eight.vercel.app"),
  title: {
    default: "PeningJob — Buat Tugasan, Kumpul Ganjaran & Naikkan Engagement",
    template: "%s · PeningJob",
  },
  description:
    "Platform komuniti Malaysia: selesaikan tugasan ringkas untuk ganjaran tunai, atau naikkan engagement Facebook, Threads, TikTok & Instagram anda dengan pengguna sebenar.",
  openGraph: {
    title: "PeningJob — Buat Tugasan, Kumpul Ganjaran",
    description:
      "Buat tugasan ringkas, kumpul ganjaran tunai. Naikkan engagement sosial dengan komuniti sebenar Malaysia.",
    locale: "ms_MY",
    type: "website",
  },
};

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    var ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) localStorage.setItem('tk_ref', ref.toUpperCase());
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
