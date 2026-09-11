import { DatabaseZap, TerminalSquare, KeyRound } from "lucide-react";

export default function DbSetupGuide({ detail }: { detail?: string }) {
  return (
    <main className="pt-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white">
            <DatabaseZap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Database not configured
            </h1>
            <p className="text-sm text-zinc-600">
              The app needs a PostgreSQL connection string to load documents.
            </p>
          </div>
        </div>

        {detail && (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-900 p-3 text-xs text-red-200">
            {detail.slice(0, 500)}
          </pre>
        )}

        <ol className="mt-5 space-y-4 text-sm text-zinc-800">
          <li className="flex gap-3">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>1. Get a free Postgres URL</strong> — Neon (neon.tech) → New
              Project → copy the pooled connection string. Vercel Postgres works too.
            </span>
          </li>
          <li className="flex gap-3">
            <TerminalSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>2. Create <code>.env.local</code></strong> next to{" "}
              <code>.env.example</code>:
            </span>
          </li>
        </ol>

        <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs leading-5 text-zinc-100">
{`DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"`}
        </pre>

        <ol className="mt-4 space-y-4 text-sm text-zinc-800" start={3}>
          <li>
            <strong>3. Push schema & restart:</strong>
          </li>
        </ol>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs leading-5 text-zinc-100">
{`npx prisma db push
npm run dev`}
        </pre>
        <p className="mt-4 text-xs text-zinc-500">
          No restart pickup? Stop the dev server (Ctrl+C) and run{" "}
          <code>npm run dev</code> again — Next.js only loads env files at startup.
        </p>
      </div>
    </main>
  );
}
