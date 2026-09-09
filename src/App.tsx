import { useEffect, useState } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { JobsPage } from "./pages/JobsPage";
import { LoginPage } from "./pages/LoginPage";

function setBrowserPath(to: string) {
  if (window.location.pathname !== to) {
    window.history.pushState({}, "", to);
  }
}

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch("/api/session")
      .then((response) => response.json() as Promise<{ authenticated?: boolean }>)
      .then((body) => setAuthenticated(body.authenticated === true));
  }, []);

  useEffect(() => {
    if (authenticated === null) {
      return;
    }
    setBrowserPath(authenticated ? "/" : "/login");
  }, [authenticated]);

  if (authenticated === null) {
    return <p className="muted boot">Loading…</p>;
  }

  if (!authenticated) {
    return (
      <LoginPage
        onLoggedIn={() => {
          setAuthenticated(true);
        }}
      />
    );
  }

  return (
    <ConvexClientProvider>
      <JobsPage
        onLoggedOut={() => {
          setAuthenticated(false);
        }}
      />
    </ConvexClientProvider>
  );
}
