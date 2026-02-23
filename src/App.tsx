/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";

interface Confession {
  id: number;
  text: string;
  created_at: string;
}

export default function App() {
  const [confession, setConfession] = useState("");
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfessions();
  }, []);

  const fetchConfessions = async () => {
    try {
      const response = await fetch("/api/confessions");
      const data = await response.json();
      setConfessions(data);
    } catch (err) {
      console.error("Failed to fetch confessions:", err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!confession.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: confession }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setConfession("");
        fetchConfessions();
      }
    } catch (err) {
      setError("Failed to submit confession");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 font-sans text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Anonymous Wall</h1>
          <p className="mt-2 text-neutral-500 italic">Share your secrets safely.</p>
        </header>

        <section className="mb-12 rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="confession" className="block text-sm font-medium text-neutral-700 mb-2">
                Your Confession
              </label>
              <textarea
                id="confession"
                rows={4}
                className="w-full rounded-xl border border-neutral-200 p-4 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                placeholder="What's on your mind?"
                value={confession}
                onChange={(e) => setConfession(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !confession.trim()}
              className="w-full rounded-xl bg-neutral-900 py-3 font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Checking..." : "Submit Confession"}
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold border-b border-neutral-200 pb-2">Recent Confessions</h2>
          <div className="grid gap-4">
            {confessions.length === 0 ? (
              <p className="text-center text-neutral-400 py-12">No confessions yet. Be the first!</p>
            ) : (
              confessions.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl bg-white p-6 shadow-sm border border-neutral-100 hover:border-neutral-200 transition-all"
                >
                  <p className="text-neutral-800 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                  <div className="mt-4 flex justify-end">
                    <span className="text-xs text-neutral-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

