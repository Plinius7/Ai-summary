type StatusBannerProps = {
  message: string | null;
  tone?: "info" | "error";
};

export default function StatusBanner({ message, tone = "info" }: StatusBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-slate-200 bg-white/60 text-slate-700"
      }`}
    >
      {message}
    </div>
  );
}
