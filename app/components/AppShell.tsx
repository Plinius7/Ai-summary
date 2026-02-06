"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import type { DocumentRecord } from "../lib/types";
import AuthCard from "./AuthCard";
import DocumentsList from "./DocumentsList";
import StatusBanner from "./StatusBanner";
import SummaryPanel from "./SummaryPanel";
import UploadForm from "./UploadForm";

export default function AppShell() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedDocument = documents.find((doc) => doc.id === selectedId) ?? null;

  const loadDocuments = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/documents", {
        method: "GET",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load documents");
      }

      setDocuments(payload.documents ?? []);
      setSelectedId((payload.documents?.[0]?.id as string | undefined) ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
      if (data.session?.user) {
        loadDocuments();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user) {
        loadDocuments();
      } else {
        setDocuments([]);
        setSelectedId(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleUploadComplete = (documentId: string) => {
    loadDocuments().then(() => {
      setSelectedId(documentId);
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2e8f0,_#f8fafc_45%,_#ffffff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">AI Summary Vault</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Upload PDFs or text files, let the AI summarize them, and revisit your
              library anytime.
            </p>
          </div>
          {userEmail ? (
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm">
              <span className="text-slate-600">{userEmail}</span>
              <button
                type="button"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </header>

        {!userEmail ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <AuthCard onSignedIn={loadDocuments} />
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6">
              <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                <li>1. Upload a PDF or TXT file to Supabase Storage.</li>
                <li>2. We extract and cache the text in PostgreSQL.</li>
                <li>3. GitHub Models generates a summary.</li>
                <li>4. You can revisit the summary anytime.</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_1.25fr]">
            <div className="space-y-6">
              <UploadForm
                onUploaded={handleUploadComplete}
                onError={(text) => setMessage(text)}
              />
              <StatusBanner message={message} tone="error" />
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
                  Loading documents...
                </div>
              ) : (
                <DocumentsList
                  documents={documents}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
            <div className="space-y-4">
              <SummaryPanel document={selectedDocument} />
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 text-xs text-slate-500">
                Summaries are cached. Uploading the same content again will reuse the
                existing summary when available.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
