export type DocumentRecord = {
  id: string;
  file_name: string;
  summary: string | null;
  summary_status: "processing" | "completed" | "failed";
  created_at: string;
  file_url?: string | null;
};
