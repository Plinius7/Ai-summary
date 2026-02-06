import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "../../lib/supabase/server";
import type { DocumentRecord } from "../../lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error: queryError } = await adminClient
    .from("documents")
    .select("id,file_name,summary,summary_status,created_at,file_path")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const bucket = process.env.SUPABASE_BUCKET ?? "documents";
  const documents = await Promise.all(
    (data ?? []).map(async (doc) => {
      let fileUrl: string | null = null;
      if (doc.file_path) {
        const { data: signed } = await adminClient.storage
          .from(bucket)
          .createSignedUrl(doc.file_path, 60 * 30);
        fileUrl = signed?.signedUrl ?? null;
      }

      return {
        id: doc.id,
        file_name: doc.file_name,
        summary: doc.summary,
        summary_status: doc.summary_status,
        created_at: doc.created_at,
        file_url: fileUrl,
      } satisfies DocumentRecord;
    })
  );

  return NextResponse.json({ documents });
}
