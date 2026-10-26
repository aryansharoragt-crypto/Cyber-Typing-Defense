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
      })
    }
  }
}
