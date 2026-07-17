import { Nav, Footer } from "@/components/site";

type Row = { name: string; jobs: number; income: number };

// Seed leaderboard so the page isn't empty at launch. Replace with live
// `leaderboard()` RPC data once real members start earning.
const SEED: Row[] = [
  { name: "Nurul Aisyah", jobs: 1284, income: 3820.5 },
  { name: "Muhammad Danish", jobs: 1176, income: 3510.0 },
  { name: "Siti Nurhaliza A.", jobs: 1043, income: 3128.75 },
  { name: "Arif Hakimi", jobs: 987, income: 2954.25 },
  { name: "Farah Iman", jobs: 902, income: 2705.0 },
  { name: "Tan Wei Jie", jobs: 841, income: 2523.5 },
  { name: "Amirah Zahra", jobs: 768, income: 2301.75 },
  { name: "Haziq Danial", jobs: 712, income: 2134.0 },
  { name: "Kavitha R.", jobs: 655, income: 1962.25 },
  { name: "Aiman Firdaus", jobs: 598, income: 1789.5 },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function rm(n: number) {
  return "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Leaderboard() {
  return (
    <div>
      <Nav />
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="text-center">
          <span className="pj-eyebrow">Papan Pendahulu</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">🏆 Top 10 Komuniti</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Ahli PeningJob paling aktif — jumlah tugasan siap &amp; pendapatan terkumpul.
          </p>
        </div>

        <div className="mt-10 space-y-2.5">
          {SEED.map((r, i) => (
            <div
              key={r.name}
              className={`pj-card flex items-center gap-4 p-4 ${i < 3 ? "ring-1 ring-brand-300/50" : ""}`}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-lg font-bold dark:bg-white/5">
                {MEDALS[i] ?? <span className="text-slate-400">{i + 1}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{r.name}</p>
                <p className="text-xs text-slate-500">{r.jobs.toLocaleString()} tugasan siap</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-gradient">{rm(r.income)}</p>
                <p className="text-xs text-slate-400">jumlah pendapatan</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Nak nama anda di sini?{" "}
          <a href="/daftar" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Daftar &amp; mula buat tugasan →
          </a>
        </p>
      </section>
      <Footer />
    </div>
  );
}
