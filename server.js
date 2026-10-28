import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

let highScores = [
  {player: 'CYBER_ACE', score: 1450, wave: 8},
  {player: 'NEO', score: 980, wave: 3},
  {player: 'ROOT_USER', score: 420, wave: 3}
];

app.get('/api/scores', (req, res) => {
  res.json(highScores.sort((a, b) => b.score - a.score).slice(0, 5));
});

app.post('/api/scores', (req, res) => {
  const { player, score, wave } = req.body;
  if (!player || score === undefined) {
    return res.status(400).json({ error: 'Missing player or score data'});
  }

  highScores.push({ player, score, wave });
  highScores = highScores.sort((a, b) => b.score - a.score).slice(0, 10);

  res.json({ success: true, scores: highScores });
});

app.listen(PORT, () => {
  console.log(`📡 Cyber-Terminal Node server listening on port ${PORT}`);
});