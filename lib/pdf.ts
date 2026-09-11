import { formatTimestamp } from "@/lib/youtube";
import type { TranscriptDTO } from "@/components/TranscriptCard";

export type PdfMode = "text" | "timestamped";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "transcript"
  );
}

type JsPDF = import("jspdf").jsPDF;

function setupDoc(pdf: JsPDF, title: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let y = 18;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  const titleLines: string[] = pdf.splitTextToSize(title, pageWidth - margin * 2);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 7 + 2;

  return { y, margin, pageWidth };
}

function addFooter(pdf: JsPDF) {
  const pages = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.text(`${i} / ${pages}`, pageWidth - 15, pageHeight - 10, { align: "right" });
  }
}

function writeWrapped(pdf: JsPDF, text: string, startY: number, opts?: { size?: number; gap?: number }) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const size = opts?.size ?? 11;
  const gap = opts?.gap ?? 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(size);
  const lines: string[] = pdf.splitTextToSize(text, pageWidth - margin * 2);
  let y = startY;
  const lineHeight = size * 0.5;
  for (const line of lines) {
    if (y > pageHeight - 15) {
      pdf.addPage();
      y = 18;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  }
  return y + gap;
}

/** Export a single transcript. Respects the reader's current text/timestamped toggle. */
export async function exportTranscriptPdf(transcript: TranscriptDTO, mode: PdfMode) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let { y } = setupDoc(pdf, transcript.title);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  y = writeWrapped(pdf, transcript.videoUrl, y, { size: 10, gap: 2 });
  y = writeWrapped(
    pdf,
    `Exported ${new Date().toLocaleDateString()} · ${mode === "timestamped" ? "timestamped captions" : "readable text"}`,
    y,
    { size: 9, gap: 6 }
  );

  if (mode === "timestamped" && transcript.captions?.length) {
    for (const c of transcript.captions) {
      y = writeWrapped(pdf, `[${formatTimestamp(c.offset)}] ${c.text}`, y, { size: 11, gap: 2 });
    }
  } else {
    for (const p of transcript.text.split(/\n\n+/).filter(Boolean)) {
      y = writeWrapped(pdf, p, y, { size: 11, gap: 4 });
    }
  }

  addFooter(pdf);
  pdf.save(`${slugify(transcript.title)}.pdf`);
}

/** Export a whole document (all transcripts, readable text with per-video headers). */
export async function exportDocumentPdf(docTitle: string, transcripts: TranscriptDTO[]) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let { y } = setupDoc(pdf, docTitle);

  pdf.setFont("helvetica", "normal");
  y = writeWrapped(
    pdf,
    `${transcripts.length} video${transcripts.length === 1 ? "" : "s"} · exported ${new Date().toLocaleDateString()}`,
    y,
    { size: 10, gap: 6 }
  );

  transcripts.forEach((t, idx) => {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y > pageHeight - 40) {
      pdf.addPage();
      y = 18;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    const heading: string[] = pdf.splitTextToSize(
      `${idx + 1}. ${t.title}`,
      pdf.internal.pageSize.getWidth() - 30
    );
    if (y + heading.length * 6 > pageHeight - 15) {
      pdf.addPage();
      y = 18;
    }
    pdf.text(heading, 15, y);
    y += heading.length * 6 + 2;

    y = writeWrapped(pdf, t.videoUrl, y, { size: 9, gap: 3 });
    for (const p of t.text.split(/\n\n+/).filter(Boolean)) {
      y = writeWrapped(pdf, p, y, { size: 11, gap: 4 });
    }
    y += 4;
  });

  addFooter(pdf);
  pdf.save(`${slugify(docTitle)}.pdf`);
}
