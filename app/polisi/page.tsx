import { Nav, Footer } from "@/components/site";

const SECTIONS = [
  {
    h: "1. Akaun & Kelayakan",
    p: "Anda mesti berumur 18 tahun ke atas (atau mendapat kebenaran penjaga) untuk menggunakan PeningJob. Satu individu dibenarkan memiliki satu akaun sahaja. Akaun berganda akan digantung.",
  },
  {
    h: "2. Tugasan & Ganjaran",
    p: "Ganjaran dikreditkan ke wallet selepas bukti tugasan disemak dan diluluskan. Bukti palsu, spam, atau penyalahgunaan sistem akan menyebabkan submission ditolak dan akaun boleh digantung tanpa notis.",
  },
  {
    h: "3. Kandungan Dilarang",
    p: "Kami tidak menerima tugasan atau kempen yang melibatkan fitnah, penipuan, kandungan lucah, perjudian haram, atau apa-apa yang menyalahi undang-undang Malaysia. Semua kempen disemak sebelum diluluskan.",
  },
  {
    h: "4. Wallet & Pengeluaran",
    p: "Baki wallet boleh dikeluarkan ke akaun bank atau e-wallet berdaftar anda. Permohonan pengeluaran diproses dalam tempoh 24 jam waktu bekerja. Maklumat bank yang salah adalah tanggungjawab pengguna.",
  },
  {
    h: "5. Privasi Data",
    p: "Kami menyimpan hanya data yang perlu: nama, emel, nombor WhatsApp dan maklumat pembayaran anda. Data tidak sesekali dijual kepada pihak ketiga. Anda boleh memohon pemadaman akaun pada bila-bila masa.",
  },
  {
    h: "6. Risiko Platform Pihak Ketiga",
    p: "Aktiviti engagement mungkin tertakluk kepada terma perkhidmatan platform media sosial masing-masing. Pengguna dinasihatkan memahami risiko tersebut sebelum melancarkan kempen atau membuat tugasan.",
  },
  {
    h: "7. Perubahan Polisi",
    p: "Polisi ini boleh dikemas kini dari semasa ke semasa. Penggunaan berterusan selepas perubahan bermakna anda bersetuju dengan polisi terkini.",
  },
];

export default function Polisi() {
  return (
    <div>
      <Nav />
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold">Polisi & Terma Penggunaan</h1>
        <p className="mt-3 text-center text-sm text-slate-500">Kemas kini terakhir: Julai 2026</p>
        <div className="mt-10 space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.h} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-semibold">{s.h}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.p}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
