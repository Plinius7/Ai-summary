import crypto from "crypto";
import pdfParse from "pdf-parse";
import { NextResponse } from "next/server";
import { generateSummary } from "../../../lib/ai";
import { createSupabaseAdminClient, createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_CHARS = 200_000;
const MAX_MODEL_CHARS = 12_000;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
  }

  const originalFileName = file.name || "document";
  const safeFileName = sanitizeFileName(originalFileName);
  const mimeType = file.type || "application/octet-stream";
  const isPdf = mimeType === "application/pdf" || originalFileName.toLowerCase().endsWith(".pdf");
  const isTxt = mimeType === "text/plain" || originalFileName.toLowerCase().endsWith(".txt");

  if (!isPdf && !isTxt) {
    return NextResponse.json({ error: "Only PDF and TXT files are supported" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText = "";

  try {
    if (isPdf) {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text ?? "";
    } else {
      extractedText = buffer.toString("utf-8");
    }
  } catch (parseError) {
    return NextResponse.json({ error: "Failed to extract text" }, { status: 400 });
  }

  extractedText = normalizeText(extractedText);
  if (!extractedText) {
    return NextResponse.json({ error: "No text found in document" }, { status: 400 });
  }

  const truncatedText = extractedText.slice(0, MAX_TEXT_CHARS);
  const contentHash = crypto.createHash("sha256").update(truncatedText).digest("hex");
  const adminClient = createSupabaseAdminClient();
  const bucket = process.env.SUPABASE_BUCKET ?? "documents";

  const { data: existing } = await adminClient
    .from("documents")
    .select("id,summary,summary_status")
    .eq("user_id", user.id)
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existing?.summary && existing.summary_status === "completed") {
    const { data: cachedDoc } = await adminClient
      .from("documents")
      .select("id,file_name,summary,summary_status,created_at,file_path")
      .eq("id", existing.id)
      .single();

    return NextResponse.json({ document: cachedDoc, cached: true });
  }

  const documentId = existing?.id ?? crypto.randomUUID();
  const storagePath = `${user.id}/${documentId}/${safeFileName}`;

  if (!existing) {
    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: insertError } = await adminClient.from("documents").insert({
      id: documentId,
      user_id: user.id,
      file_name: originalFileName,
      file_path: storagePath,
      mime_type: mimeType,
      size_bytes: file.size,
      content_hash: contentHash,
      text_content: truncatedText,
      summary_status: "processing",
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    await adminClient
      .from("documents")
      .update({ text_content: truncatedText, summary_status: "processing" })
      .eq("id", existing.id);
  }

  try {
    const summary = await generateSummary(truncatedText.slice(0, MAX_MODEL_CHARS));
    await adminClient
      .from("documents")
      .update({ summary, summary_status: "completed" })
      .eq("id", documentId);

    const { data: savedDoc } = await adminClient
      .from("documents")
      .select("id,file_name,summary,summary_status,created_at,file_path")
      .eq("id", documentId)
      .single();

    return NextResponse.json({ document: savedDoc, cached: false });
  } catch (summaryError) {
    await adminClient
      .from("documents")
      .update({ summary_status: "failed" })
      .eq("id", documentId);

    return NextResponse.json(
      { error: summaryError instanceof Error ? summaryError.message : "Summary failed" },
      { status: 500 }
    );
  }
}
