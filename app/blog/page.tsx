import Link from "next/link";
import { Nav, Footer } from "@/components/site";

export const POSTS = [
  {
    slug: "cara-jana-pendapatan-sampingan-dengan-tugasan-online",
    title: "Cara Jana Pendapatan Sampingan dengan Tugasan Online",
    excerpt:
      "Tak perlu modal, tak perlu kemahiran khas — hanya telefon & beberapa minit sehari. Ini caranya.",
    date: "Julai 2026",
    body: [
      "Ramai orang fikir menjana pendapatan online memerlukan modal besar atau kemahiran teknikal. Sebenarnya, tugasan mikro (micro-tasks) adalah cara paling mudah untuk bermula — anda hanya perlukan telefon dan akaun media sosial.",
      "Di TugasKu, setiap tugasan mempunyai nilai ganjaran yang jelas sebelum anda mula. Selesaikan tugasan seperti follow akaun, like post, atau tulis komen — hantar bukti, dan ganjaran masuk terus ke wallet selepas disemak.",
      "Tip daripada kami: konsisten lebih penting daripada volume. 10-15 minit sehari secara tetap boleh mengumpul jumlah yang bermakna dalam sebulan, ditambah XP untuk naik level.",
      "Bila baki wallet cukup, mohon pengeluaran ke bank atau e-wallet anda. Proses semakan mengambil masa kurang 24 jam waktu bekerja.",
    ],
  },
  {
    slug: "kenapa-engagement-organik-lebih-baik-dari-bot",
    title: "Kenapa Engagement Organik Lebih Baik daripada Bot",
    excerpt:
      "Angka besar daripada bot nampak hebat — sehingga algoritma menghukum akaun anda. Ini beza sebenarnya.",
    date: "Julai 2026",
    body: [
      "Bot boleh memberikan 10,000 followers dalam sehari — tetapi followers itu tidak menonton video anda, tidak komen, dan tidak membeli. Algoritma platform mengesan corak ini dan menurunkan capaian akaun anda.",
      "Engagement organik daripada pengguna sebenar berbeza: profil lengkap, aktiviti semula jadi, dan interaksi yang mengikut kadar masa yang munasabah (drip-feed).",
      "Di TugasKu, setiap interaksi datang daripada ahli komuniti sebenar di Malaysia. Mereka mendapat ganjaran untuk masa mereka, anda mendapat engagement yang kelihatan — dan memang — sahih.",
      "Pelaburan kecil dalam engagement berkualiti memberi pulangan lebih baik daripada angka besar yang kosong.",
    ],
  },
  {
    slug: "5-tip-akaun-selamat-semasa-buat-tugasan",
    title: "5 Tip Jaga Akaun Anda Semasa Buat Tugasan",
    excerpt:
      "Keselamatan akaun anda keutamaan. Ikut 5 amalan ini supaya akaun media sosial anda kekal sihat.",
    date: "Julai 2026",
    body: [
      "1. Jangan guna akaun utama untuk volume tinggi — pelbagaikan aktiviti anda supaya kekal semula jadi.",
      "2. Buat tugasan mengikut kadar manusia. Jangan selesaikan 50 tugasan dalam 5 minit; ambil masa seperti penggunaan biasa.",
      "3. Jangan sesekali kongsi kata laluan. TugasKu tidak pernah meminta kata laluan media sosial anda — bukti hanya melalui screenshot atau link.",
      "4. Pastikan aktiviti anda pelbagai: selang-seli antara scroll biasa, posting sendiri, dan tugasan.",
      "5. Jika platform memberi amaran aktiviti, berhenti seketika. Akaun sihat lebih bernilai daripada mana-mana ganjaran.",
    ],
  },
];

export default function Blog() {
  return (
    <div>
      <Nav />
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Blog TugasKu</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Panduan & tip untuk pembuat tugasan dan pemilik bisnes.
          </p>
        </div>
        <div className="mt-10 space-y-5">
          {POSTS.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{p.date}</p>
              <h2 className="mt-2 text-xl font-bold">{p.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{p.excerpt}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand-500">Baca artikel →</span>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
