import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

const STATUS_LABELS = {
  queued: "Queued",
  downloading: "Downloading PNGs",
  bundling: "Bundling PDF",
  uploading: "Uploading",
  completed: "Completed",
  failed: "Failed",
} as const;

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function JobsPage({ onLoggedOut }: { onLoggedOut: () => void }) {
  const jobs = useQuery(api.jobs.list);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function startJob() {
    setStarting(true);
    setStartError(null);
    try {
      const response = await fetch("/api/jobs/process", { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to start job");
      }
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Failed to start job");
    } finally {
      setStarting(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    onLoggedOut();
  }

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <div>
          <p className="eyebrow">Vercel Function + Convex</p>
          <h1>Image bundle jobs</h1>
        </div>
        <button className="ghost" type="button" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="panel start-panel">
        <div>
          <h2>Start a processing job</h2>
          <p>
            This calls a Vercel Function. It downloads 30 PNGs, scales each to
            5000×5000, stitches them into a PDF, stores the file, and streams
            status through Convex.
          </p>
        </div>
        <button type="button" onClick={startJob} disabled={starting}>
          {starting ? "Starting…" : "Run job on Vercel Function"}
        </button>
        {startError ? <p className="form-error">{startError}</p> : null}
      </section>

      <section className="job-list">
        {jobs === undefined ? <p className="muted">Loading jobs…</p> : null}
        {jobs?.length === 0 ? (
          <div className="empty">
            <h2>No jobs yet</h2>
            <p>Start one to watch a Vercel Function scale 30 PNGs to 5000×5000 and bundle a PDF.</p>
          </div>
        ) : null}
        {jobs?.map((job) => (
          <article key={job._id} className={`job-card status-${job.status}`}>
            <div className="job-top">
              <div>
                <p className="eyebrow">{job.runtime}</p>
                <h3>{job.title}</h3>
              </div>
              <span className={`status-pill status-${job.status}`}>
                {STATUS_LABELS[job.status]}
              </span>
            </div>
            <p className="job-message">{job.message}</p>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${job.progress}%` }} />
            </div>
            <dl className="job-meta">
              <div>
                <dt>Created</dt>
                <dd>{formatTime(job.createdAt)}</dd>
              </div>
              <div>
                <dt>Images</dt>
                <dd>
                  {job.downloadedCount}/{job.imageCount}
                </dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>{job.progress}%</dd>
              </div>
            </dl>
            {job.error ? <p className="form-error">{job.error}</p> : null}
            {job.status === "completed" && job.pdfUrl ? (
              <a className="download" href={job.pdfUrl} target="_blank" rel="noreferrer">
                Download PDF
              </a>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
