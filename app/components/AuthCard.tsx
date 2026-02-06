"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

type AuthCardProps = {
  onSignedIn: () => void;
};

export default function AuthCard({ onSignedIn }: AuthCardProps) {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    onSignedIn();
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check your email to confirm the account.");
  };

  const handleMagicLink = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Magic link sent. Check your inbox.");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
      <p className="mt-2 text-sm text-slate-600">
        Use email and password or request a magic link to continue.
      </p>
      <div className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleSignIn}
            disabled={loading || !email || !password}
          >
            Sign in
          </button>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleSignUp}
            disabled={loading || !email || !password}
          >
            Create account
          </button>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleMagicLink}
            disabled={loading || !email}
          >
            Magic link
          </button>
        </div>
        {message ? (
          <p className="text-sm text-slate-600">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
