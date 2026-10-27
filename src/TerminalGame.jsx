import React, { useState, useEffect, useRef } from 'react';

const WORD_DICTIONARY = [
  'VIRUS', 'TROJAN', 'MALWARE', 'EXPLOIT', 'CORRUPT',
  'OVERFLOW', 'ROOTKIT', 'SPYWARE', 'PAYLOAD', 'LOGIC_BOMB',
  'FIREWALL', 'DECRYPT', 'SYN_FLOOD', 'BACKDOOR', 'ZERO_DAY'
];

export default function TerminalGame() {
  const [typedInput, setTypedInput] = useState('');
  const [score, setScore] = useState(0);
  const [health,seHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [highScores, setHighScores] = useSate([]);

  const canvasRef = useRef(null);
  const enemiesRef = useRef([]);
  const requestRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/scores')
      .then((res) => res.json())
      .then((data) => setHighScores(data))
      .catch(() => console.log('Offline mode active - local scores only'));
  }, []);

  useEffect(() => {
    if (gameOver) return;
    
    const canvas=canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let spawnTimer = 0;

    const gameLoop = () => {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x=0; x<canvas.width; x+= 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 40);
      ctx.lineTo(canvas.width, canvas.height - 40);
      ctx.stroke();

      spawnTimer++;
      const spawnRate = Math.max(30, 120-wave*10);
      if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        const randomWord = WORD_DICTIONARY[Math.floor(Math.random()*WORD_DICTIONARY.length)];
        enemiesRef.current.push({
          id: Date.now()+Math.random(),
          word: randomWord,
          x: Math.random() * (canvas.width - 120) + 20,
          y: 0,
          speed: 0.8 + wave * 0.2
        });
      }

      enemiesRef.current.forEach((enemy, index) => {
        enemy.y += enemy.speed;

        ctx.fillStyle = '#1e1b18';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.fillRect(enemy.x, enemy.y, 110, 30);
        ctx.strokeRect(enemy.x, enemy.y, 110, 30);

        ctx.fillStyle = '#f87171'
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.word, enemy.x+55, enemy.y+19);

        if (enemy.y>=canvas.height - 40) {
          setHealth((prev) => {
            const nextHealth = prev-15;
            if (nextHealth <= 0) {
              setGameOver(true);
            }
            return Math.max(0, nextHealth);
          });
          enemiesRef.current.splice(index, 1);
        }
      });
      requestRef.current = requestAnimationFrame(gameLoop);
    };
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameOver, wave]);

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().trim();
    setTypedInput(value);

    const matchedIndex = enemiesRef.current.findIndex((enemy) => enemy.word === value);

    if (matchedIndex !== -1) {
      enemiesRef.current.splice(matchedIndex, 1);
      setTypedInput('');
      setScore((prev) => {
        const newScore = prev+100;
        if (newScore % 500 == 0) setWave((w) => w+1);
        return newScore;
      });
    }
  };

  const handleRestart = () => {
    enemiesRef.current = [];
    setScore(0);
    setHealth(100);
    setWave(1);
    setTypedInput('');
    setGameOver(false);
  };

  return (
    <div style = {styles.container}>
      <header style={styles.header}>
        <h1 style = {styles.title}>⚡ CYBER-TERMINAL DEFENSE v1.0</h1>
        <div style={styles.statsBar}>
          <span>CORE HEALTH: <b style={{color: health > 30 ? '#22c55e' : '#ef4444'}}>{health}%</b></span>
          <span>SCORE: <b style={{color: '#f59e0b'}}>{score}</b></span>
          <span>WAVE: <b style={{color: '#3b82f6'}}>{wave}</b></span>
        </div>
      </header>

      <div style = {styles.canvasContainer}>
        <canvas ref={canvasRef} width={500} height={400} style={styles.canvas} />

        {gameOver && (
          <div style={styles.gameOverOverlay}>
            <h2 style={{ color: '#ef4444', margin: 0 }}>🚨 SYSTEM CRASHED!</h2>
            <p>Final score: {score} | Wave reached: {wave}</p>
            <button onClick={handleRestart} style={styles.restartBtn}>
              REBOOT FIREWALL
            </button>
          </div>
        )}
      </div>

      <div styles={styles.inputArea}>
        <span style={styles.prompt}>TYPE_CMD_&gt;</span>
        <input
          type='text'
          value={typedInput}
          onChange={handleInputChange}
          disabled={gameOver}
          placeholder={gameOver ? "SYSTEM OFFLINE" : 'Type bug word to destroy...'}
          autoFocus
          style={styles.input}
        />
      </div>

      
    </div>
  )
}
