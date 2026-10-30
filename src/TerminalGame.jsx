import React, { useState, useEffect, useRef } from 'react';

const WORD_DICTIONARY = [
  'VIRUS', 'TROJAN', 'MALWARE', 'EXPLOIT', 'CORRUPT', 
  'OVERFLOW', 'ROOTKIT', 'SPYWARE', 'PAYLOAD', 'LOGIC_BOMB',
  'FIREWALL', 'DECRYPT', 'SYN_FLOOD', 'BACKDOOR', 'ZERO_DAY'
];

export default function TerminalGame() {
  const [typedInput, setTypedInput] = useState('');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [empCharges, setEmpCharges] = useState(2);
  const [isEmpActive, setIsEmpActive] = useState(false);
  const [credits, setCredits] = useState(0);
  const [maxHealth, setMaxHealth] = useState(100);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [hasShield, setHasShield] = useState(false);
  const [isSloMoActive, setIsSloMoActive] = useState(false);
  const [hasAutoTurret, setHasAutoTurret] = useState(false);

  const canvasRef = useRef(null);
  const enemiesRef = useRef([]);
  const requestRef = useRef(null);

  const healthRef = useRef(health);
  healthRef.current = health;
  const gameOverRef = useRef(gameOver);
  gameOverRef.current = gameOver;

  useEffect(() => {
    if (!hasAutoTurret) return;

    const turretInterval = setInterval(() => {
      if (gameOverRef.current) return;
      if (enemiesRef.current.length > 0) {

        const randomIndex = Math.floor(Math.random() * enemiesRef.current.length);
        enemiesRef.current.splice(randomIndex, 1);

        setScore((prev) => prev+(100*scoreMultiplier));
        setCredits((prev) => prev+10);
      }
    }, 4000);

    return () => clearInterval(turretInterval);
  }, [hasAutoTurret, scoreMultiplier]);

  useEffect(() => {
    fetch('http://localhost:5000/api/scores')
      .then((res) => res.json())
      .then((data) => setHighScores(data))
      .catch(() => console.log('Offline mode active - local scores only'));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && empCharges > 0 && !gameOver) {
        e.preventDefault();
        triggerEmp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [empCharges, gameOver]);

  const triggerEmp = () => {
    setEmpCharges((prev) => prev - 1);
    setIsEmpActive(true);

    enemiesRef.current = [];

    setTimeout(() => {
      setIsEmpActive(false);
    }, 300);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let spawnTimer = 0;

    const gameLoop = () => {
      if (gameOverRef.current) return;

      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isEmpActive) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
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
      const spawnRate = Math.max(30, 120 - wave * 10);
      if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        const randomWord = WORD_DICTIONARY[Math.floor(Math.random() * WORD_DICTIONARY.length)];
        enemiesRef.current.push({
          id: Date.now() + Math.random(),
          word: randomWord,
          x: Math.random() * (canvas.width - 120) + 20,
          y: 0,
          speed: 0.8 + wave * 0.2
        });
      }

      enemiesRef.current.forEach((enemy, index) => {
        const speedModifier = isSloMoActive ? 0.4 : 1.0;
        enemy.y += enemy.speed * speedModifier;

        ctx.fillStyle = '#1e1b18';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.fillRect(enemy.x, enemy.y, 110, 30);
        ctx.strokeRect(enemy.x, enemy.y, 110, 30);

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.word, enemy.x + 55, enemy.y + 19);

        if (enemy.y >= canvas.height - 40) {
          enemiesRef.current.splice(index, 1);

          if (hasShield) {
            setHasShield(false);
            alert('🛡️ Firewall Shield absorbed the breach! Shield offline.');
          } else {
            setHealth((prev) => {
              const nextHealth = prev - 15;
              if (nextHealth <= 0) {
                setGameOver(true);
              }
              return Math.max(0, nextHealth);
            });
          }
        }
      });

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [wave]);

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().trim();
    setTypedInput(value);

    const matchedIndex = enemiesRef.current.findIndex((enemy) => enemy.word === value);

    if (matchedIndex !== -1) {
      enemiesRef.current.splice(matchedIndex, 1);
      setTypedInput('');
      setScore((prev) => {
        const pointsEarned = 100 * scoreMultiplier;
        const newScore = prev + pointsEarned;
        if (newScore % 500 === 0) setWave((w) => w + 1);
        return newScore;
      });
      setCredits((prev) => prev + 15);
    }
  };

  const handleBuyItem = (itemType) => {
    if (itemType === 'repair') {
      if (credits < 50) { alert('Not enough credits!'); return; }
      if (health >= maxHealth) { alert('Core health is already full!'); return; }
      setCredits((c) => c - 50);
      setHealth((h) => Math.min(maxHealth, h + 25));
    } else if (itemType === 'emp') {
      if (credits < 100) { alert('Not enough credits!'); return; }
      setCredits((c) => c - 100);
      setEmpCharges((e) => e + 1);
    } else if (itemType === 'multiplier') {
      if (credits < 150) { alert('Not enough credits!'); return; }
      setCredits((c) => c - 150);
      setScoreMultiplier((m) => +(m + 0.5).toFixed(1));
    } else if (itemType === 'shield') {
      if (credits < 75) { alert('Not enough credits!'); return; }
      if (hasShield) { alert('Shield generator is already active!'); return; }
      setCredits((c) => c - 75);
      setHasShield(true);
    } else if (itemType === 'slomo') {
      if (credits < 120) { alert('Not enough credits!'); return; }
      if (isSloMoActive) { alert('Slomo is already Active!'); return; }
      setCredits((c) => c - 120);
      setIsSloMoActive(true);
      setTimeout(() => {
      setIsSloMoActive(false);
      }, 8000);
    } else if (itemType == 'autoturret') {
      if (credits<160) {alert('Not enough credits!'); return;}
      if (hasAutoTurret) {alert('Auto Turret is already deployed'); return;}
      setCredits((c) => c-160);
      setHasAutoTurret(true);
    }
  };

  const handleRestart = () => {
    enemiesRef.current = [];
    setScore(0);
    setHealth(100);
    setMaxHealth(100);
    setWave(1);
    setTypedInput('');
    setGameOver(false);
    setEmpCharges(3);
    setCredits(0);
    setScoreMultiplier(1);
    setHasShield(false);
    setIsSloMoActive(false);
    setHasAutoTurret(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>⚡ CYBER-TERMINAL DEFENSE v1.0</h1>
        <div style={styles.statsBar}>
          <span>CORE HEALTH: <b style={{ color: health > 30 ? '#22c55e' : '#ef4444' }}>{health}%</b></span>
          <span>SCORE: <b style={{ color: '#f59e0b' }}>{score}</b></span>
          <span>WAVE: <b style={{ color: '#3b82f6' }}>{wave}</b></span>
          <span>EMP BLASTS: <b style={{ color: '#38bdf8' }}>{empCharges} [SPACEBAR]</b></span>
          <span>SHIELD: <b style={{ color: hasShield ? '#38bdf8' : '#94a3b8' }}>{hasShield ? 'ONLINE🛡️' : 'OFFLINE'}</b></span>
        </div>
      </header>

      <div style={styles.canvasContainer}>
        <canvas ref={canvasRef} width={500} height={400} style={styles.canvas} />
        
        {gameOver && (
          <div style={styles.gameOverOverlay}>
            <h2 style={{ color: '#ef4444', margin: 0 }}>🚨 SYSTEM CRASHED!</h2>
            <p>Final Score: {score} | Wave Reached: {wave}</p>
            <button onClick={handleRestart} style={styles.restartBtn}>
              REBOOT FIREWALL
            </button>
          </div>
        )}
      </div>

      <div style={styles.inputArea}>
        <span style={styles.prompt}>TYPE_CMD_&gt;</span>
        <input
          type="text"
          value={typedInput}
          onChange={handleInputChange}
          disabled={gameOver}
          placeholder={gameOver ? "SYSTEM OFFLINE" : "Type bug word to destroy..."}
          autoFocus
          style={styles.input}
        />
      </div>

      <div style={styles.leaderboard}>
        <h4 style={{ margin: '0 0 8px 0', color: '#94a3b8' }}>🏆 NETWORK HIGH SCORES</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {highScores.map((s, idx) => (
            <li key={idx} style={{ fontSize: '12px', color: '#cbd5e1' }}>
              #{idx + 1} {s.player} — {s.score} pts (Wave {s.wave})
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.shopContainer}>
        <h4 style={styles.shopTitle}>🛒 BLACK-MARKET UPGRADES <span style={styles.creditBadge}>[{credits} CR]</span></h4>
        <div style={styles.shopGrid}>
          <button onClick={() => handleBuyItem('repair')} style={styles.shopBtn}>
            🔧 Repair Core <span style={styles.priceTag}>[50c]</span>
          </button>
          <button onClick={() => handleBuyItem('multiplier')} style={styles.shopBtn}>
            🚀 Overclock <span style={styles.priceTag}>[150c]</span>
          </button>
          <button onClick={() => handleBuyItem('emp')} style={styles.shopBtn}>
            ⚡ Restock EMP <span style={styles.priceTag}>[100c]</span>
          </button>
          <button 
            onClick={() => handleBuyItem('shield')} 
            disabled={hasShield}
            style={{
              ...styles.shopBtn,
              background: hasShield ? '#1e293b' : '#0284c7',
              borderColor: hasShield ? '#334155' : '#0369a1',
              color: hasShield ? '#64748b' : '#fffbf5',
              cursor: hasShield ? 'not-allowed' : 'pointer',
              boxShadow: hasShield ? 'none' : '0 3px 0 #0369a1'
            }}
          >
            🛡️ {hasShield ? 'Shield Active' : 'Energy Shield'} <span style={{ ...styles.priceTag, color: hasShield ? '#64748b' : '#fef08a' }}>{hasShield ? '' : '[75c]'}</span>
          </button>
          <button 
            onClick={() => handleBuyItem('slomo')} 
            disabled={isSloMoActive}
            style={{
              ...styles.shopBtn,
              gridColumn: 'span 2',
              background: isSloMoActive ? '#1e293b' : '#7c3aed',
              borderColor: isSloMoActive ? '#334155' : '#6d28d9',
              color: isSloMoActive ? '#64748b' : '#fffbf5',
              cursor: isSloMoActive ? 'not-allowed' : 'pointer',
              boxShadow: isSloMoActive ? 'none' : '0 3px 0 #6d28d9'
            }}
          >
            ⏳ {isSloMoActive ? 'Time Dilation Active' : 'Time Dilation'} <span style={{ ...styles.priceTag, color: isSloMoActive ? '#64748b' : '#fef08a' }}>{isSloMoActive ? '' : '[120c]'}</span>
          </button>
          <button
            onClick = {() => handleBuyItem('autoturret')}
            disabled = {hasAutoTurret}
            style = {{
              ...styles.shopBtn,
              background: hasAutoTurret ? '#1e293b' : '#059669',
              borderColor: hasAutoTurret ? '#334155' : '#047857',
              color: hasAutoTurret ? '#334155' : '#fffbf5',
              cursor: hasAutoTurret ? 'not-allowed' : 'pointer',
              boxShadow: hasAutoTurret ? 'none' : '0 3px 0 #047857'
            }}
          >
            🤖 {hasAutoTurret ? 'Turret Deployed' : 'Auto-Turret'} <span style={{ ...styles.priceTag, color: hasAutoTurret ? '#64748b' : '#fef08a' }}>{hasAutoTurret ? '' : '[160c]'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#0a0a0c',
    minHeight: '100vh',
    padding: '20px',
    color: '#f8fafc',
    fontFamily: '"Courier New", monospace'
  },
  header: { textAlign: 'center', marginBottom: '16px' },
  title: { color: '#22c55e', fontSize: '22px', margin: '0 0 10px 0' },
  statsBar: { display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 'bold' },
  canvasContainer: { position: 'relative', border: '3px solid #22c55e', borderRadius: '8px', overflow: 'hidden' },
  canvas: { display: 'block' },
  gameOverOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(10, 10, 12, 0.9)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  },
  restartBtn: {
    background: '#dc2626', color: '#fff', border: '2px solid #b91c1c',
    padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit'
  },
  inputArea: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', width: '500px' },
  prompt: { color: '#22c55e', fontWeight: 'bold' },
  input: {
    flex: 1, padding: '10px', background: '#1e1b18', border: '2px solid #22c55e',
    color: '#22c55e', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '16px', outline: 'none'
  },
  leaderboard: {
    marginTop: '20px', width: '500px', background: '#1e1b18',
    padding: '12px', borderRadius: '6px', border: '1px solid #334155'
  },
  shopContainer: {
    marginTop: '16px',
    width: '500px',
    background: '#121118',
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid #d97706',
    boxSizing: 'border-box',
    boxShadow: '0 4px 20px rgba(217, 119, 6, 0.15)'
  },
  shopTitle: { 
    margin: '0 0 12px 0', 
    color: '#fbbf24', 
    fontSize: '13px', 
    letterSpacing: '0.5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  creditBadge: {
    color: '#34d399',
    background: '#064e3b',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    border: '1px solid #059669'
  },
  shopGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  shopBtn: {
    background: '#b45309',
    color: '#fffbf5',
    border: '2px solid #92400e',
    borderRadius: '6px',
    padding: '10px 12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '12px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 3px 0 #78350f',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.1s ease'
  },
  priceTag: {
    color: '#fef08a',
    fontSize: '11px',
    fontWeight: 'normal'
  }
};
