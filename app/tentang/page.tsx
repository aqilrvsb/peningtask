import Link from "next/link";
import { Nav, Footer } from "@/components/site";

export default function Tentang() {
  return (
    <div>
      <Nav />
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold sm:text-4xl">Tentang PeningJob</h1>
        <div className="mt-8 space-y-5 text-slate-600 dark:text-slate-300">
          <p>
            PeningJob ialah platform komuniti Malaysia yang menghubungkan dua pihak:
            <b> individu</b> yang mahu menjana pendapatan sampingan melalui tugasan
            ringkas, dan <b>pemilik bisnes</b> yang mahu meningkatkan kehadiran media
            sosial mereka dengan interaksi daripada pengguna sebenar.
          </p>
          <p>
            Kami percaya kepada ketelusan: setiap ganjaran dinyatakan sebelum tugasan
            dimulakan, setiap kempen boleh dipantau secara live, dan setiap pengeluaran
            diproses dengan jelas. Tiada bot, tiada angka palsu — hanya komuniti sebenar.
          </p>
          <p>
            Platform ini dibina sepenuhnya di Malaysia, untuk rakyat Malaysia. Dari
            pelajar yang mencari duit poket hingga usahawan yang membina brand — PeningJob
            adalah untuk anda.
          </p>
        </div>
        <div className="mt-10 grid gap-4 text-center sm:grid-cols-3">
          {[
            { v: "4+", l: "Platform disokong" },
            { v: "RM0.10+", l: "Ganjaran setiap tugasan" },
            { v: "24 jam", l: "Proses pengeluaran" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-2xl font-bold text-brand-500">{s.v}</p>
              <p className="mt-1 text-sm text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/daftar" className="inline-block rounded-xl bg-brand-500 px-8 py-3 font-semibold text-white hover:bg-brand-600">
            Sertai Komuniti Kami →
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
