import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("cv") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });

    let text = "";

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      text = await file.text();

    } else if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfString = buffer.toString("binary");
      const rawMatches = pdfString.match(/\(([^)\\]{1,300}(?:\\.[^)\\]{0,300})*)\)/g) ?? [];
      text = rawMatches
        .map((m) => m.slice(1, -1)
          .replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\t/g, " ")
          .replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\"))
        .filter((s) => s.length > 1 && /[a-zA-Z]/.test(s))
        .join(" ");
      text = cleanText(text);

    } else if (file.name.endsWith(".docx")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const bufStr = buffer.toString("binary");
      const marker = "word/document.xml";
      const xmlStart = bufStr.indexOf(marker);
      if (xmlStart > 0) {
        const chunk = bufStr.slice(xmlStart + marker.length + 50, xmlStart + 60000);
        text = cleanText(
          chunk
            .replace(/<w:t[^>]*>/g, " ")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        );
      }
      if (!text || text.length < 30) {
        return NextResponse.json({ error: "Convert DOCX to PDF or TXT first." }, { status: 422 });
      }

    } else {
      return NextResponse.json({ error: "Use PDF, TXT or DOCX." }, { status: 400 });
    }

    if (!text || text.length < 30) {
      return NextResponse.json({ error: "Could not extract text. Paste CV manually." }, { status: 422 });
    }

    return NextResponse.json({ success: true, text: text.slice(0, 15000), charCount: text.length, fileName: file.name });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
