import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav, Footer } from "@/components/site";
import { POSTS } from "../page";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = POSTS.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <div>
      <Nav />
      <article className="mx-auto max-w-2xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{post!.date}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight">{post!.title}</h1>
        <div className="mt-8 space-y-5 text-slate-700 dark:text-slate-300">
          {post!.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-brand-50 p-6 text-center dark:bg-brand-500/10">
          <p className="font-semibold">Sedia untuk mula?</p>
          <Link href="/daftar" className="mt-3 inline-block rounded-xl bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600">
            Daftar Percuma →
          </Link>
        </div>
        <p className="mt-8">
          <Link href="/blog" className="text-sm font-semibold text-brand-500 hover:underline">← Semua artikel</Link>
        </p>
      </article>
      <Footer />
    </div>
  );
}
