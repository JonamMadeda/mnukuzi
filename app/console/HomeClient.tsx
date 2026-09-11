"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  FolderOpen,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import CreateDocumentModal from "@/components/CreateDocumentModal";
import { ToastProvider, useToast } from "@/components/Toast";
import { createDocument, deleteDocument } from "@/actions/transcripts";

export type DocRow = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  thumbs: string[];
  count: number;
};

type SortKey = "newest" | "oldest" | "name" | "most";

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ThumbStack({ thumbs, title }: { thumbs: string[]; title: string }) {
  const shown = thumbs.slice(0, 3);
  const extra = thumbs.length - shown.length;
  return (
    <div className="flex shrink-0 items-center">
      {shown.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className="h-11 w-16 rounded-lg border-2 border-white object-cover shadow-sm first:ml-0 -ml-6"
          style={{ zIndex: shown.length - i }}
          title={title}
        />
      ))}
      {extra > 0 && (
        <span className="z-10 -ml-6 flex h-11 w-16 items-center justify-center rounded-lg border-2 border-white bg-primary text-[11px] font-bold text-white shadow-sm">
          +{extra}
        </span>
      )}
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
      {count} document{count === 1 ? "" : "s"}
    </span>
  );
}

function Dashboard({ initialDocuments }: { initialDocuments: DocRow[] }) {
  const [docs, setDocs] = useState<DocRow[]>(initialDocuments);
  const [view, setView] = useState<"list" | "grid">("list");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [createSignal, setCreateSignal] = useState(0);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { notify } = useToast();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("folders-view");
    if (saved === "list" || saved === "grid") setView(saved);
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  function changeView(v: "list" | "grid") {
    setView(v);
    localStorage.setItem("folders-view", v);
  }

  // Mark which folder is being opened so the user gets instant feedback
  // while the destination page loads its documents from the server.
  function handleOpen(id: string) {
    setOpeningId(id);
    setTimeout(() => setOpeningId((cur) => (cur === id ? null : cur)), 12000);
  }

  async function handleCreate(title: string) {
    const res = await createDocument(title);
    if (!res.ok) {
      notify(res.error, "error");
      return;
    }
    setDocs((d) => [
      {
        id: res.data.id,
        title: res.data.title,
        createdAt: res.data.createdAt.toISOString(),
        updatedAt: res.data.updatedAt.toISOString(),
        thumbs: [],
        count: 0,
      },
      ...d,
    ]);
    notify("Folder created");
    router.refresh();
  }

  // Two-step inline delete: first click arms, second click confirms.
  // Reverts automatically so a stray click never destroys data.
  function handleDeleteClick(id: string, title: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(null), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmId(null);
    void handleDelete(id, title);
  }

  async function handleDelete(id: string, title: string) {
    await deleteDocument(id);
    setDocs((d) => d.filter((x) => x.id !== id));
    notify(`Folder "${title}" deleted`);
    router.refresh();
  }

  const stats = useMemo(() => {
    const totalDocs = docs.reduce((n, d) => n + d.count, 0);
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const fresh = docs.filter((d) => new Date(d.createdAt).getTime() > weekAgo).length;
    return { folders: docs.length, totalDocs, fresh };
  }, [docs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? docs.filter((d) => d.title.toLowerCase().includes(q)) : [...docs];
    switch (sort) {
      case "oldest":
        return filtered.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      case "name":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "most":
        return filtered.sort((a, b) => b.count - a.count);
      default:
        return filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
  }, [docs, query, sort]);

  function deleteControl(doc: DocRow, compact?: boolean) {
    const armed = confirmId === doc.id;
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          handleDeleteClick(doc.id, doc.title);
        }}
        title={armed ? "Click again to confirm delete" : `Delete folder "${doc.title}"`}
        aria-label={armed ? `Confirm delete folder ${doc.title}` : `Delete folder ${doc.title}`}
        className={`relative z-10 shrink-0 rounded-lg transition ${
          armed
            ? "bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            : `${compact ? "p-1.5" : "p-2"} text-zinc-300 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100`
        }`}
      >
        {armed ? "Confirm?" : <Trash2 className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <main className="pt-10">
      {/* Contextual header — brand lives in the global nav above */}
      <header className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your folders</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {stats.folders} folder{stats.folders === 1 ? "" : "s"} · {stats.totalDocs}{" "}
            document{stats.totalDocs === 1 ? "" : "s"}
            {stats.fresh > 0 && ` · ${stats.fresh} new this week`}
          </p>
        </div>
        <div className="ml-auto">
          <CreateDocumentModal onCreate={handleCreate} openRequest={createSignal} />
        </div>
      </header>

      {/* Stats strip */}
      {docs.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Folders", value: stats.folders },
            { label: "Documents", value: stats.totalDocs },
            { label: "New this week", value: stats.fresh },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-2xl font-bold tracking-tight text-primary">{s.value}</p>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sticky toolbar: search + sort + view */}
      {docs.length > 0 && (
        <div className="sticky top-0 z-10 -mx-1 mt-6 bg-zinc-50/90 px-1 py-2 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-44 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search folders…"
                aria-label="Search folders"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort folders"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 outline-none focus:border-brand-600"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name A–Z</option>
              <option value="most">Most documents</option>
            </select>
            <div
              className="inline-flex rounded-xl bg-zinc-100 p-1 text-xs font-semibold"
              role="tablist"
              aria-label="View mode"
            >
              <button
                onClick={() => changeView("list")}
                title="List view"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${
                  view === "list" ? "bg-white text-zinc-900 shadow" : "text-zinc-500"
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => changeView("grid")}
                title="Grid view"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${
                  view === "grid" ? "bg-white text-zinc-900 shadow" : "text-zinc-500"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
          {query.trim() && (
            <p className="mt-2 text-xs text-zinc-500" role="status">
              {visible.length} of {docs.length} folders match “{query.trim()}”
            </p>
          )}
        </div>
      )}

      {docs.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
            <FileText className="h-6 w-6 text-brand-700" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No folders yet</h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Create your first folder, open it, then paste YouTube links inside —
            each one becomes a readable document.
          </p>
          <button
            onClick={() => setCreateSignal((n) => n + 1)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
          >
            <Plus className="h-4 w-4" /> Create your first folder
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">No matches</h2>
          <p className="mt-1 text-sm text-zinc-500">
            No folders match “{query.trim()}”.{" "}
            <button onClick={() => setQuery("")} className="font-semibold text-brand-700 hover:underline">
              Clear search
            </button>
          </p>
        </div>
      ) : view === "list" ? (
        <div className="mt-6 space-y-3">
          {visible.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <Link
                href={`/folder/${doc.id}`}
                onClick={() => handleOpen(doc.id)}
                className="absolute inset-0 rounded-2xl"
                aria-label={`Open folder ${doc.title}`}
              />
              {doc.thumbs.length > 0 ? (
                <ThumbStack thumbs={doc.thumbs} title={doc.title} />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                  <FolderOpen className="h-5 w-5 text-brand-700" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-semibold">{doc.title}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Edited {formatRelative(doc.updatedAt)}
                  </span>
                  <CountBadge count={doc.count} />
                </div>
              </div>
              {deleteControl(doc)}
              {openingId === doc.id ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening…
                </span>
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((doc) => (
            <div
              key={doc.id}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <Link
                href={`/folder/${doc.id}`}
                onClick={() => handleOpen(doc.id)}
                className="absolute inset-0 rounded-2xl"
                aria-label={`Open folder ${doc.title}`}
              />
              <div className="flex items-start justify-between gap-2">
                {doc.thumbs.length > 0 ? (
                  <ThumbStack thumbs={doc.thumbs} title={doc.title} />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                    <FolderOpen className="h-5 w-5 text-brand-700" />
                  </div>
                )}
                {deleteControl(doc, true)}
              </div>
              <h2 className="mt-3 truncate text-base font-semibold">{doc.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Edited {formatRelative(doc.updatedAt)}
                </span>
                <CountBadge count={doc.count} />
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {openingId === doc.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Opening…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Open folder
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function HomeClient({ initialDocuments }: { initialDocuments: DocRow[] }) {
  return (
    <ToastProvider>
      <Dashboard initialDocuments={initialDocuments} />
    </ToastProvider>
  );
}
