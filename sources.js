// --- Canvas Bulk Builder: source material ingestion ---
//
// Handles the formats teachers actually drop in: .docx (Word), plus plain
// text-like files. DOCX is a ZIP container, so we read its central directory
// and inflate word/document.xml with the browser's native DecompressionStream.
// No third-party library, which keeps the extension dependency-free.

const TEXT_EXTENSIONS = ["txt", "md", "markdown", "html", "htm", "csv", "tsv", "json", "rtf"];

function fileExtension(name) {
  const parts = String(name || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

// ---------- minimal ZIP reader ----------

function findEndOfCentralDirectory(view, bytes) {
  // EOCD signature 0x06054b50, scanning back over the (max 64KB) comment field.
  const maxScan = Math.min(bytes.length, 66000);
  for (let i = bytes.length - 22; i >= bytes.length - maxScan && i >= 0; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) return i;
  }
  return -1;
}

async function inflateRaw(bytes) {
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntry(buffer, wantedName) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const eocd = findEndOfCentralDirectory(view, bytes);
  if (eocd === -1) throw new Error("Not a readable ZIP/DOCX container.");

  const entryCount = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);

  const decoder = new TextDecoder();

  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;

    const method = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);

    const name = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));

    if (name === wantedName) {
      // Local header lengths can differ from the central directory's.
      const localNameLen = view.getUint16(localOffset + 26, true);
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const raw = bytes.subarray(dataStart, dataStart + compressedSize);

      if (method === 0) return decoder.decode(raw);
      if (method === 8) return decoder.decode(await inflateRaw(raw));
      throw new Error(`Unsupported ZIP compression method: ${method}`);
    }

    ptr += 46 + nameLen + extraLen + commentLen;
  }

  throw new Error(`${wantedName} not found in the document.`);
}

// ---------- DOCX -> text ----------

function decodeXmlEntities(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

function docxXmlToText(xml) {
  return decodeXmlEntities(
    xml
      // Preserve list/numbering hints before tags are stripped.
      .replace(/<w:tab\b[^>]*\/>/g, "\t")
      .replace(/<w:br\b[^>]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readDocx(file) {
  const buffer = await file.arrayBuffer();
  const xml = await readZipEntry(buffer, "word/document.xml");
  const text = docxXmlToText(xml);
  if (!text) throw new Error("The Word document appears to contain no text.");
  return text;
}

// ---------- public entry point ----------

async function readSourceFile(file) {
  const ext = fileExtension(file.name);

  if (ext === "docx") {
    return { name: file.name, kind: "docx", content: await readDocx(file) };
  }

  if (ext === "doc") {
    throw new Error(
      "Legacy .doc is not supported. Re-save as .docx, or paste the text directly."
    );
  }

  if (ext === "pdf") {
    throw new Error(
      "PDF is not supported yet. Copy the text out, or export the file as .docx."
    );
  }

  if (TEXT_EXTENSIONS.includes(ext) || file.type.startsWith("text/")) {
    const content = await file.text();
    if (!content.trim()) throw new Error("That file is empty.");
    return { name: file.name, kind: ext || "text", content };
  }

  throw new Error(
    `Unsupported file type: .${ext || "unknown"}. Use .docx, .txt, .md, .html, or .csv.`
  );
}
