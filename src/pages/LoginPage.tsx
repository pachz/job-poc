import { FormEvent, useState } from "react";

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Wrong password. Try 123456.");
        return;
      }

      onLoggedIn();
    } catch {
      setError("Could not sign in. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Processing lab</p>
        <h1>Sign in</h1>
        <p className="lede">
          Static password login for this POC. Jobs run on Vercel Functions; Convex
          keeps live status.
        </p>
        <form onSubmit={onSubmit}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="123456"
            required
          />
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Enter lab"}
          </button>
        </form>
        <p className="hint">Password is hardcoded to 123456.</p>
      </section>
    </main>
  );
}
