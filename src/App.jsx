import { useCallback, useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import TerminalGame from "./TerminalGame.jsx";
import ScoreTable from "./ScoreTable.jsx";

function App() {
  const [scores, setScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [apiError, setApiError] = useState("");

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/api/scores");
      if (!response.ok) throw new Error("Could not load leaderboard.");
      setScores(await response.json());
      setApiError("");
    } catch (error) {
      setApiError(error.message);
    }
  }, []);

  useEffect(() => {
    loadScores();

    const loadStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) throw new Error("Could not load system stats.");
        setStats(await response.json());
      } catch {
        setStats(null);
      }
    };

    loadStats();
    const interval = window.setInterval(loadStats, 5000);
    return () => window.clearInterval(interval);
  }, [loadScores]);

  const submitScore = async (name, score) => {
    const response = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save score.");
    await loadScores();
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            {"{ }"}
          </span>
          <span>CYBER<span className="brand-accent">DEFENSE</span></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/">Game</Link>
          <Link to="/leaderboard">Leaderboard</Link>
        </nav>
        <span className="connection-status">
          <span className="status-dot" />
          SYSTEM ONLINE
        </span>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <TerminalGame
              scores={scores}
              stats={stats}
              apiError={apiError}
              onSubmitScore={submitScore}
            />
          }
        />
        <Route
          path="/leaderboard"
          element={
            <section className="leaderboard-page panel">
              <div className="section-heading">
                <span className="eyebrow">NETWORK RECORDS</span>
                <h1>TOP OPERATORS</h1>
              </div>
              <ScoreTable scores={scores} />
              {apiError && <p className="error-message">{apiError}</p>}
              <Link className="text-link" to="/">← RETURN TO DEFENSE</Link>
            </section>
          }
        />
        <Route path="*" element={<TerminalGame scores={scores} stats={stats} apiError={apiError} onSubmitScore={submitScore} />} />
      </Routes>

      <footer className="footer">
        <span>CYBER TYPING DEFENSE <span aria-hidden="true">/</span> BUILD 01.26</span>
        <span>PROTECT THE GRID. TYPE TO SURVIVE.</span>
      </footer>
    </main>
  );
}

export default App;
