import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import EvolutionChart from './components/EvolutionChart';
import { GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState<number>(0);
  const [nextPlanetIndex, setNextPlanetIndex] = useState<number>(0);
  const [gameWon, setGameWon] = useState<boolean>(false);

  const startGame = useCallback(() => {
    setScore(0);
    setGameState(GameState.PLAYING);
    setNextPlanetIndex(Math.floor(Math.random() * 3));
    setGameWon(false);
  }, []);

  const restartGame = useCallback(() => {
    setScore(0);
    setGameState(GameState.PLAYING);
    setNextPlanetIndex(Math.floor(Math.random() * 3));
    setGameWon(false);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState(GameState.GAME_OVER);
  }, []);

  const handleGameWin = useCallback(() => {
    setGameWon(true);
    // Hide the "Game Clear" badge after 5 seconds so player can continue playing
    setTimeout(() => {
        setGameWon(false);
    }, 5000);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-slate-950 flex flex-col items-center font-sans py-6">
      {/* Background decoration - Fixed so it doesn't scroll */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-60 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 scanlines opacity-30 pointer-events-none"></div>
      
      {/* Game Container */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center px-4 md:px-0">
        {/* Game Title (Small, top) */}
        <div className="w-full text-center opacity-50 pointer-events-none mb-2">
             <span className="text-[10px] tracking-[0.3em] uppercase text-blue-200">System: Solar // Sector 7</span>
        </div>

        {/* Physics Canvas & Overlay Wrapper */}
        <div className="relative w-full rounded-b-xl shadow-2xl bg-slate-900/50 backdrop-blur-sm border-x-4 border-b-4 border-slate-700 overflow-hidden">
          <GameCanvas 
            gameState={gameState}
            setGameState={setGameState}
            setScore={setScore}
            nextPlanetIndex={nextPlanetIndex}
            setNextPlanetIndex={setNextPlanetIndex}
            onGameOver={handleGameOver}
            onGameWin={handleGameWin}
          />

          {/* UI Overlay (Menu, Score, Game Over) */}
          <UIOverlay 
            score={score}
            nextPlanetIndex={nextPlanetIndex}
            gameState={gameState}
            gameWon={gameWon}
            onStart={startGame}
            onRestart={restartGame}
          />
        </div>
        
        {/* Mobile controls hint */}
        <div className="mt-4 text-xs text-slate-500 opacity-60 pointer-events-none text-center">
            {gameState === GameState.PLAYING && "Drag / Tap to Drop"}
        </div>

        {/* Evolution Chart */}
        <EvolutionChart />
        
        {/* Bottom spacer */}
        <div className="h-10"></div>
      </div>
    </div>
  );
};

export default App;