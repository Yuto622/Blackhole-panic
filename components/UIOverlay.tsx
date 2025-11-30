import React from 'react';
import { GameState } from '../types';
import { PLANETS } from '../constants';

interface UIOverlayProps {
  score: number;
  nextPlanetIndex: number;
  gameState: GameState;
  gameWon: boolean;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ score, nextPlanetIndex, gameState, gameWon, onStart, onRestart }) => {
  const nextPlanet = PLANETS[nextPlanetIndex];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 max-w-lg mx-auto w-full">
      {/* Game Win Banner - Top Center */}
      {gameWon && (
         <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 animate-bounce">
            <div className="bg-yellow-400 text-yellow-900 font-black px-6 py-1 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.8)] border-2 border-white tracking-widest text-lg whitespace-nowrap">
                GAME CLEAR!
            </div>
            <div className="mt-1 text-yellow-300 font-bold text-shadow-sm drop-shadow-md text-sm tracking-widest bg-black/40 px-3 rounded-full">
                ゲームクリア！
            </div>
         </div>
      )}

      {/* HUD */}
      <div className="flex justify-between items-start w-full relative z-30">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</p>
          <p className="text-2xl font-mono text-yellow-400 font-bold">{score.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-lg p-2 shadow-lg flex flex-col items-center min-w-[80px]">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Next</p>
          <div 
            className="rounded-full shadow-inner border border-white/20 flex items-center justify-center text-[10px] font-bold text-shadow-sm"
            style={{ 
                width: 30, 
                height: 30, 
                backgroundColor: nextPlanet.color,
                color: nextPlanet.textColor
            }}
          >
            {nextPlanet.label}
          </div>
        </div>
      </div>

      {/* Start Screen */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-600 p-8 rounded-2xl shadow-2xl text-center max-w-xs animate-bounce-in">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              COSMIC MERGE
            </h1>
            <p className="text-slate-400 mb-6 text-sm">Drop planets, merge them, and create a Black Hole!</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6 opacity-70">
                 {PLANETS.slice(0, 5).map(p => (
                     <div key={p.id} className="w-6 h-6 rounded-full" style={{backgroundColor: p.color}}></div>
                 ))}
                 <span className="text-xs self-center">...</span>
            </div>
            <button 
              onClick={onStart}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              Start Mission
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div 
          onClick={onRestart}
          className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 pointer-events-auto cursor-pointer"
        >
          <div className="text-center p-8 animate-pulse">
            <h2 className="text-5xl font-black text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">GAME OVER</h2>
            <p className="text-slate-300 text-lg mb-2">Final Score</p>
            <p className="text-4xl font-mono text-yellow-400 font-bold mb-8">{score.toLocaleString()}</p>
            <p className="text-slate-500 text-sm">Tap screen to return to Title</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;