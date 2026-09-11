"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Video, CalendarDays, Trash2, Youtube, FolderOpen, LayoutGrid, List, ChevronRight, Loader2 } from "lucide-react";
import CreateDocumentModal from "@/components/CreateDocumentModal";
import { ToastProvider, useToast } from "@/components/Toast";
import { createDocument, deleteDocument } from "@/actions/transcripts";

export type DocRow = {
  id: string;
  title: string;
  createdAt: string;
  count: number;
};

function Dashboard({ initialDocuments }: { initialDocuments: DocRow[] }) {
  const [docs, setDocs] = useState<DocRow[]>(initialDocuments);
  const [view, setView] = useState<"list" | "grid">("list");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const { notify } = useToast();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("folders-view");
    if (saved === "list" || saved === "grid") setView(saved);
  }, []);

  function changeView(v: "list" | "grid") {
    setView(v);
    localStorage.setItem("folders-view", v);
  }

  // Mark which folder is being opened so the user gets instant feedback
  // while the destination page loads its documents from the server.
  // The state clears on unmount after successful navigation; the timeout
  // is a safety net in case navigation fails and this page stays mounted.
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
      { id: res.data.id, title: res.data.title, createdAt: res.data.createdAt.toISOString(), count: 0 },
      ...d,
    ]);
    notify("Folder created");
    router.refresh();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}" and all its documents?`)) return;
    await deleteDocument(id);
    setDocs((d) => d.filter((x) => x.id !== id));
    notify("Folder deleted");
    router.refresh();
  }

  return (
    <main className="pt-10">
      <header className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white">
            <Youtube className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mnukuzi</h1>
            <p className="text-sm text-zinc-500">
              Folders for your YouTube research — each folder holds many documents.
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {docs.length > 0 && (
            <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-xs font-semibold" role="tablist" aria-label="View mode">
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
          )}
          <CreateDocumentModal onCreate={handleCreate} />
        </div>
      </header>

      {docs.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
            <FileText className="h-6 w-6 text-zinc-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No folders yet</h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Create your first folder, open it, then paste YouTube links inside —
            each one becomes a readable document.
          </p>
        </div>
      ) : view === "list" ? (
        <div className="mt-8 space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <Link
                href={`/folder/${doc.id}`}
                onClick={() => handleOpen(doc.id)}
                className="absolute inset-0 rounded-2xl"
                aria-label={doc.title}
              />
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <FolderOpen className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-semibold">{doc.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" />
                    {doc.count} document{doc.count === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(doc.id, doc.title);
                }}
                title="Delete folder"
                className="relative z-10 shrink-0 rounded-lg p-2 text-zinc-300 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <Link
                href={`/folder/${doc.id}`}
                onClick={() => handleOpen(doc.id)}
                className="absolute inset-0 rounded-2xl"
                aria-label={doc.title}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                  <FolderOpen className="h-5 w-5 text-zinc-600" />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(doc.id, doc.title);
                  }}
                  title="Delete folder"
                  className="relative z-10 rounded-lg p-1.5 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h2 className="mt-3 truncate text-base font-semibold">{doc.title}</h2>
              <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  {doc.count} document{doc.count === 1 ? "" : "s"}
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-zinc-900">
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
