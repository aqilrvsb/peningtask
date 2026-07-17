import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

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
    document.documentElement.classList.remove('dark');
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
    <html lang="ms" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
