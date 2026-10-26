function ScoreTable({ scores }) {
  if (scores.length === 0) {
    return <p className="empty-state">No records yet. Be the first operator.</p>;
  }

  return (
    <ol className="score-list">
      {scores.map((entry, index) => (
        <li className="score-row" key={`${entry.date}-${index}`}>
          <span className="score-rank">{String(index + 1).padStart(2, "0")}</span>
          <span className="score-name">{entry.name}</span>
          <span className="score-points">{entry.score.toLocaleString()} PTS</span>
        </li>
      ))}
    </ol>
  );
}

export default ScoreTable;
