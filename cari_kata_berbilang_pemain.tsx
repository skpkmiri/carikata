import React, { useState, useEffect, useRef } from 'react';

// Senarai 10 Tema
const THEMES = [
  { id: 1, name: "Haiwan", words: ["KUCING", "ANJING", "BURUNG", "IKAN", "GAJAH"] },
  { id: 2, name: "Buah", words: ["EPAL", "OREN", "PISANG", "BETIK", "MANGGA"] },
  { id: 3, name: "Warna", words: ["MERAH", "BIRU", "HIJAU", "KUNING", "HITAM"] },
  { id: 4, name: "Sukan", words: ["BOLA", "RENANG", "LARI", "HOKI", "TENIS"] },
  { id: 5, name: "Kenderaan", words: ["KERETA", "BAS", "LORI", "KAPAL", "BASIKAL"] },
  { id: 6, name: "Pekerjaan", words: ["GURU", "DOKTOR", "POLIS", "BOMBA", "HAKIM"] },
  { id: 7, name: "Negara", words: ["JEPUN", "KOREA", "CHINA", "INDIA", "MESIR"] },
  { id: 8, name: "Muzik", words: ["GITAR", "PIANO", "DRUM", "BIOLA", "SULING"] },
  { id: 9, name: "Angkasa", words: ["BULAN", "BUMI", "BINTANG", "KOMET", "ROKET"] },
  { id: 10, name: "Komputer", words: ["TETIKUS", "PAPAN", "SKRIN", "WAYAR", "DATA"] }
];

// Konfigurasi Tahap
const LEVEL_CONFIG = {
  mudah: { name: 'Mudah', size: 9, dirs: ['H', 'V'] },
  sederhana: { name: 'Sederhana', size: 10, dirs: ['H', 'V', 'D', 'HR', 'VR'] }
};

const DIRS = {
  'H': [0, 1],
  'V': [1, 0],
  'D': [1, 1],
  'HR': [0, -1],
  'VR': [-1, 0],
  'DR': [-1, -1]
};

const PLAYER_COLORS = [
  { bg: 'bg-green-500', text: 'text-white', lightBg: 'bg-green-100', border: 'border-green-400' },
  { bg: 'bg-blue-500', text: 'text-white', lightBg: 'bg-blue-100', border: 'border-blue-400' },
  { bg: 'bg-purple-500', text: 'text-white', lightBg: 'bg-purple-100', border: 'border-purple-400' },
  { bg: 'bg-orange-500', text: 'text-white', lightBg: 'bg-orange-100', border: 'border-orange-400' },
];

// Komponen Papan untuk setiap pemain (membolehkan split screen)
const PlayerBoard = ({ player, masterGrid, wordsToFind, onWordFound, onComplete, numPlayers, isGameOver }) => {
  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [finished, setFinished] = useState(false);

  // Reset local state bila masterGrid atau words berubah (tab baru)
  useEffect(() => {
    setFoundWords([]);
    setFoundCells([]);
    setCurrentSelection([]);
    setIsSelecting(false);
    setFinished(false);
  }, [masterGrid, wordsToFind]);

  const getLine = (r1, c1, r2, c2) => {
    let path = [];
    let dr = r2 - r1;
    let dc = c2 - c1;
    let steps = Math.max(Math.abs(dr), Math.abs(dc));
    
    if (steps === 0) return [{ r: r1, c: c1 }];
    if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) return [];

    let rStep = dr === 0 ? 0 : dr / Math.abs(dr);
    let cStep = dc === 0 ? 0 : dc / Math.abs(dc);

    for (let i = 0; i <= steps; i++) {
      path.push({ r: r1 + i * rStep, c: c1 + i * cStep });
    }
    return path;
  };

  const handleDown = (r, c) => {
    if (finished || isGameOver) return;
    setIsSelecting(true);
    setStartCell({ r, c });
    setCurrentSelection([{ r, c }]);
  };

  const handleEnter = (r, c) => {
    if (!isSelecting || !startCell || finished || isGameOver) return;
    const line = getLine(startCell.r, startCell.c, r, c);
    setCurrentSelection(line);
  };

  const handleUp = () => {
    if (!isSelecting || finished || isGameOver) return;
    setIsSelecting(false);

    if (currentSelection.length > 0) {
      const selectedWord = currentSelection.map(cell => masterGrid[cell.r][cell.c]).join('');
      const reversedWord = selectedWord.split('').reverse().join('');
      
      let matchedWord = null;
      if (wordsToFind.includes(selectedWord) && !foundWords.includes(selectedWord)) {
        matchedWord = selectedWord;
      } else if (wordsToFind.includes(reversedWord) && !foundWords.includes(reversedWord)) {
        matchedWord = reversedWord;
      }

      if (matchedWord) {
        const newFoundWords = [...foundWords, matchedWord];
        const newFoundCells = [...foundCells, ...currentSelection.map(c => `${c.r},${c.c}`)];
        
        setFoundWords(newFoundWords);
        setFoundCells(newFoundCells);
        onWordFound(player.id, 10); // +10 markah setiap perkataan
        
        // Cek jika pemain telah tamat mencari semua perkataan
        if (newFoundWords.length === wordsToFind.length) {
          setFinished(true);
          onComplete(player.id);
        }
      }
    }
    setCurrentSelection([]);
    setStartCell(null);
  };

  const handleTouchMove = (e) => {
    if (!isSelecting || finished || isGameOver) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Pastikan touch element kepunyaan board pemain ini sahaja
    if (elem && elem.dataset.pid === String(player.id) && elem.dataset.r !== undefined) {
      const r = parseInt(elem.dataset.r);
      const c = parseInt(elem.dataset.c);
      handleEnter(r, c);
    }
  };

  const isCellSelected = (r, c) => currentSelection.some(cell => cell.r === r && cell.c === c);
  const isCellFound = (r, c) => foundCells.includes(`${r},${c}`);

  // Sesuaikan saiz cell bergantung kepada bilangan pemain (supaya muat skrin)
  let cellSize = "w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-sm sm:text-lg md:text-xl";
  if (numPlayers > 2) {
    cellSize = "w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 text-xs sm:text-sm md:text-lg";
  } else if (numPlayers === 2) {
    cellSize = "w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 text-xs sm:text-base md:text-xl";
  }

  return (
    <div className={`flex flex-col bg-white rounded-xl shadow-md border-2 ${player.color.border} overflow-hidden`}>
      <div className={`${player.color.bg} ${player.color.text} py-2 px-4 flex justify-between items-center`}>
        <span className="font-bold truncate">{player.name}</span>
        <div className="flex gap-2 text-sm">
          <span className="font-semibold">{player.score} Markah</span>
          <span className="bg-black/20 px-2 rounded-full">{foundWords.length}/{wordsToFind.length}</span>
        </div>
      </div>
      
      <div className={`p-2 sm:p-4 flex-1 flex flex-col items-center ${finished ? player.color.lightBg : 'bg-slate-50'}`}>
        {finished ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 py-8">
            <span className="text-4xl">🎉</span>
            <span className={`font-bold text-lg ${player.color.text.replace('text-white', `text-${player.color.bg.split('-')[1]}-700`)}`}>
              Selesai!
            </span>
          </div>
        ) : (
          <div 
            className="grid gap-1 touch-none mx-auto"
            style={{ gridTemplateColumns: `repeat(${masterGrid.length}, minmax(0, 1fr))` }}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            onTouchEnd={handleUp}
            onTouchMove={handleTouchMove}
          >
            {masterGrid.map((row, r) => (
              row.map((letter, c) => {
                const selected = isCellSelected(r, c);
                const found = isCellFound(r, c);
                
                let bgClasses = "bg-white text-slate-700 border border-slate-200";
                if (selected) {
                  bgClasses = "bg-slate-600 text-white shadow-inner";
                } else if (found) {
                  bgClasses = `${player.color.bg} text-white shadow-inner opacity-90`;
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    data-pid={player.id}
                    data-r={r}
                    data-c={c}
                    onMouseDown={() => handleDown(r, c)}
                    onMouseEnter={() => handleEnter(r, c)}
                    onTouchStart={() => handleDown(r, c)}
                    className={`${cellSize} flex items-center justify-center font-bold rounded cursor-pointer transition-colors duration-100 ${bgClasses}`}
                  >
                    {letter}
                  </div>
                );
              })
            ))}
          </div>
        )}

        <div className="mt-4 w-full px-2">
          <div className="flex flex-wrap justify-center gap-1.5">
            {wordsToFind.map((word) => {
              const isFound = foundWords.includes(word);
              return (
                <span 
                  key={word} 
                  className={`px-2 py-1 rounded text-xs sm:text-sm font-semibold transition-all ${
                    isFound 
                      ? `${player.color.bg} text-white line-through opacity-70` 
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // State Setup & Pemain
  const [gameState, setGameState] = useState('setup'); // 'setup' | 'playing' | 'results'
  const [numPlayers, setNumPlayers] = useState(1);
  const [playerNames, setPlayerNames] = useState(['Pemain 1', '', '', '']);
  const [players, setPlayers] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('mudah');
  
  // State Papan & Permainan
  const [activeTab, setActiveTab] = useState(0);
  const [masterGrid, setMasterGrid] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]);
  
  // State Pemasa & Keputusan
  const [timeLeft, setTimeLeft] = useState(300); // 5 minit = 300 saat
  const [playersCompleted, setPlayersCompleted] = useState([]); // array id pemain yg dah siap
  const [isGameOver, setIsGameOver] = useState(false);

  // --- LOGIK PERSEDIAAN ---
  const startGame = () => {
    const activePlayers = [];
    for (let i = 0; i < numPlayers; i++) {
      activePlayers.push({
        id: i,
        name: playerNames[i] || `Pemain ${i + 1}`,
        score: 0,
        color: PLAYER_COLORS[i]
      });
    }
    setPlayers(activePlayers);
    setGameState('playing');
    loadTheme(0);
  };

  const loadTheme = (tabIndex) => {
    setActiveTab(tabIndex);
    const theme = THEMES[tabIndex];
    const config = LEVEL_CONFIG[selectedDifficulty];
    const size = config.size;
    
    let newGrid = Array(size).fill(null).map(() => Array(size).fill(''));

    const tryPlaceWord = (word) => {
      const maxAttempts = 200;
      for (let i = 0; i < maxAttempts; i++) {
        const dirKey = config.dirs[Math.floor(Math.random() * config.dirs.length)];
        const [dr, dc] = DIRS[dirKey];
        const r = Math.floor(Math.random() * size);
        const c = Math.floor(Math.random() * size);

        const endR = r + dr * (word.length - 1);
        const endC = c + dc * (word.length - 1);
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;

        let canPlace = true;
        for (let j = 0; j < word.length; j++) {
          const currR = r + dr * j;
          const currC = c + dc * j;
          if (newGrid[currR][currC] !== '' && newGrid[currR][currC] !== word[j]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let j = 0; j < word.length; j++) {
            newGrid[r + dr * j][c + dc * j] = word[j];
          }
          return true;
        }
      }
      return false;
    };

    theme.words.forEach(word => tryPlaceWord(word));

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setMasterGrid(newGrid);
    setWordsToFind(theme.words);
    
    // Reset Stats untuk Pusingan Baru
    setTimeLeft(300); 
    setPlayersCompleted([]);
    setIsGameOver(false);
  };

  useEffect(() => {
    let timerId = null;
    if (gameState === 'playing' && !isGameOver && timeLeft > 0) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing' && !isGameOver) {
      handleGameOver();
    }
    return () => clearTimeout(timerId);
  }, [timeLeft, gameState, isGameOver]);

  const handleWordFound = (playerId, points) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, score: p.score + points } : p));
  };

  const handlePlayerComplete = (playerId) => {
    const newCompleted = [...playersCompleted, playerId];
    setPlayersCompleted(newCompleted);
    
    // Beri bonus masa sebagai markah
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, score: p.score + timeLeft } : p));

    // Jika semua pemain sudah tamat
    if (newCompleted.length === players.length) {
      handleGameOver();
    }
  };

  const handleGameOver = () => {
    setIsGameOver(true);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-indigo-700 tracking-tight">CARI KATA</h1>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-2">Cabaran Berbilang Pemain</p>
          </div>
          
          <div className="space-y-6">
            {/* Pilihan Tahap */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tahap Permainan:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDifficulty('mudah')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${
                    selectedDifficulty === 'mudah' ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Mudah (Lurus)
                </button>
                <button
                  onClick={() => setSelectedDifficulty('sederhana')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${
                    selectedDifficulty === 'sederhana' ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Sederhana (Silang)
                </button>
              </div>
            </div>

            {/* Pilihan Jumlah Pemain */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Bilangan Pemain:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setNumPlayers(num)}
                    className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                      numPlayers === num ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {num} Orang
                  </button>
                ))}
              </div>
            </div>

            {/* Nama Pemain */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-1">Nama Pemain:</label>
              {Array.from({ length: numPlayers }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md shadow-sm ${PLAYER_COLORS[idx].bg}`}></div>
                  <input
                    type="text"
                    placeholder={`Pemain ${idx + 1}`}
                    value={playerNames[idx]}
                    onChange={(e) => {
                      const newNames = [...playerNames];
                      newNames[idx] = e.target.value;
                      setPlayerNames(newNames);
                    }}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    maxLength={15}
                  />
                </div>
              ))}
            </div>

            <button 
              onClick={startGame}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 text-lg"
            >
              MULA BERMAIN!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT GRID SPLIT SCREEN ---
  let gridLayoutClass = "grid-cols-1";
  if (numPlayers === 2) gridLayoutClass = "grid-cols-1 sm:grid-cols-2";
  if (numPlayers > 2) gridLayoutClass = "grid-cols-2";

  // Senarai Pemenang (Leaderboard) jika Game Over
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 flex flex-col font-sans select-none h-screen overflow-hidden">
      
      {/* Header Info Bar */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between shrink-0 shadow-md relative z-10">
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white tracking-wide">Cabaran Tahap {LEVEL_CONFIG[selectedDifficulty].name}</span>
          <span className="text-xs text-slate-400">Markah: 10/perkataan + Bonus Masa</span>
        </div>
        
        {/* Timer UI */}
        <div className={`flex flex-col items-center px-6 py-1 rounded-lg border-2 ${timeLeft < 30 ? 'bg-red-900/50 border-red-500 animate-pulse' : 'bg-slate-800 border-indigo-500'}`}>
           <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Masa Pusingan</span>
           <span className={`text-3xl font-black font-mono leading-none ${timeLeft < 30 ? 'text-red-400' : 'text-indigo-300'}`}>
              {formatTime(timeLeft)}
           </span>
        </div>

        <button onClick={() => { setGameState('setup'); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold transition-colors">
          Tamat & Keluar
        </button>
      </div>

      {/* Tabs / Soalan */}
      <div className="flex overflow-x-auto bg-slate-800 border-b border-slate-700 scrollbar-hide shrink-0 shadow-sm relative z-0">
        {THEMES.map((theme, index) => (
          <button
            key={theme.id}
            onClick={() => loadTheme(index)}
            className={`flex-shrink-0 px-6 py-3 text-sm font-bold transition-all ${
              activeTab === index 
                ? 'bg-indigo-600 text-white shadow-[inset_0_-3px_0_rgba(255,255,255,0.4)]' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Soalan #{index + 1}: {theme.name}
          </button>
        ))}
      </div>

      {/* Main Play Area (Split Screen) */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-800 relative">
        
        {isGameOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-300">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Masa Tamat! ⏱️</h2>
              <p className="text-slate-500 mb-6 font-medium">Keputusan Pusingan Ini:</p>
              
              <div className="space-y-3 mb-6">
                {sortedPlayers.map((p, idx) => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${idx === 0 ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400 ring-opacity-50' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold w-6">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ' '}</span>
                      <span className="font-bold text-slate-700">{p.name}</span>
                    </div>
                    <span className="text-lg font-black text-indigo-600">{p.score} pt</span>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-slate-500 mb-6">Pilih Soalan / Tema di atas untuk terus bermain dan kumpul lebih banyak markah!</p>
            </div>
          </div>
        )}

        <div className={`grid gap-2 sm:gap-4 h-full ${gridLayoutClass}`}>
          {players.map(player => (
            <PlayerBoard 
              key={player.id} 
              player={player}
              masterGrid={masterGrid}
              wordsToFind={wordsToFind}
              onWordFound={handleWordFound}
              onComplete={handlePlayerComplete}
              numPlayers={numPlayers}
              isGameOver={isGameOver}
            />
          ))}
        </div>
      </div>
      
    </div>
  );
}