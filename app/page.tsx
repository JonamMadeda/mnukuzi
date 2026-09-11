import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Copy,
  FileDown,
  FolderOpen,
  Lock,
  Play,
  Youtube,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth/server";
import Reveal from "@/components/Reveal";

const features = [
  {
    icon: FolderOpen,
    title: "Folders, not chaos",
    body: "Group transcripts into folders — one per course, project, or research thread. Each holds as many documents as you need.",
  },
  {
    icon: Youtube,
    title: "Any YouTube link",
    body: "Paste watch URLs, shortened youtu.be links, or Shorts. Captions and video details are fetched server-side, no API key needed.",
  },
  {
    icon: Clock,
    title: "Readable or timestamped",
    body: "Toggle between clean paragraph text and timestamped caption lines inside a focused reader modal.",
  },
  {
    icon: Copy,
    title: "Copy & export",
    body: "Copy all captions in one click, or download a single document — or a whole folder — as a paginated PDF.",
  },
  {
    icon: Lock,
    title: "Private to your account",
    body: "Sign up in seconds. Every folder and document is scoped to your account and invisible to everyone else.",
  },
  {
    icon: FileDown,
    title: "Take it anywhere",
    body: "PDF exports include titles, source links, and page numbers — ready for notes, citations, or sharing.",
  },
];

const steps = [
  { n: "1", title: "Create a folder", body: "Name it after your course or topic." },
  { n: "2", title: "Paste a link", body: "Any YouTube URL — the transcript is extracted automatically." },
  { n: "3", title: "Read, copy, export", body: "Open the document, toggle views, copy or download the PDF." },
];

const mockDocs = [
  {
    title: "Hooks deep dive — useEffect explained",
    meta: "48 caption lines",
    gradient: "from-primary to-primary-light",
  },
  {
    title: "State patterns you should know",
    meta: "112 caption lines",
    gradient: "from-brand-500 to-brand-700",
  },
  {
    title: "Server Components, simply put",
    meta: "76 caption lines",
    gradient: "from-zinc-600 to-zinc-900",
  },
];

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{children}</p>
  );
}

export default async function LandingPage() {
  // Signed-in users skip the pitch and go straight to work.
  if (await getSessionUser()) {
    redirect("/console");
  }

  return (
    <main className="pt-10">
      {/* Hero */}
      <section className="relative mx-auto max-w-3xl text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-72 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-brand-100 blur-3xl"
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-white">
          <Youtube className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Turn YouTube videos into readable documents
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-500">
          Mnukuzi extracts transcripts from any YouTube link and organizes them
          into folders — so you can read, copy, and export video knowledge like
          real documents.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Sign in
          </Link>
        </div>

        {/* Product mock — a folder at a glance */}
        <Reveal className="mt-10 text-left">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                <FolderOpen className="h-5 w-5 text-brand-700" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">React Course Notes</p>
                <p className="text-xs text-zinc-500">Edited 2h ago</p>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                3 documents
              </span>
            </div>
            <div className="space-y-2 p-4">
              {mockDocs.map((d) => (
                <div
                  key={d.title}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5"
                >
                  <span
                    className={`flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${d.gradient}`}
                  >
                    <Play className="h-4 w-4 fill-white text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{d.title}</p>
                    <p className="text-xs text-zinc-500">{d.meta}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm">
                    <BookOpen className="h-3.5 w-3.5" /> Read
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-16 max-w-4xl">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            From video to document in three steps
          </h2>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-3 text-[15px] font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto mt-14 max-w-4xl">
        <Reveal>
          <Eyebrow>Features</Eyebrow>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Everything you need to learn from video
          </h2>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 90}>
              <div className="h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                  <f.icon className="h-5 w-5 text-brand-700" />
                </div>
                <h3 className="mt-3 text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <Reveal className="mx-auto mt-12 max-w-4xl">
        <section className="rounded-3xl bg-primary p-8 text-center text-white shadow-xl ring-1 ring-brand-500/40 sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight">
            Your video library, minus the rewatching
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-300">
            Free to start. Your folders stay private to your account.
          </p>
          <Link
            href="/auth/sign-up"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-brand-50"
          >
            Create free account <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </Reveal>

      {/* Footer */}
      <footer className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-200 py-6 text-xs text-zinc-500">
        <span className="font-bold text-zinc-700">Mnukuzi © 2026</span>
        <Link href="/auth/sign-in" className="hover:text-zinc-900 hover:underline">
          Sign in
        </Link>
        <Link href="/auth/sign-up" className="hover:text-zinc-900 hover:underline">
          Get started
        </Link>
        <Link href="/console" className="hover:text-zinc-900 hover:underline">
          Console
        </Link>
      </footer>
    </main>
  );
}
