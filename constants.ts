import { PlanetType } from './types';

// Physics world dimensions (logical pixels)
// We will scale the canvas visually, but physics runs in this resolution
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const WALL_THICKNESS = 50;
export const DEAD_LINE_Y = 100; // The line which if crossed causes game over

export const PLANETS: PlanetType[] = [
  { id: 0, name: 'Dust', jpName: '宇宙ダスト', label: 'Dust', radius: 15, color: '#94a3b8', textColor: '#000', score: 2 },
  { id: 1, name: 'Asteroid', jpName: '小惑星', label: 'Ast', radius: 22, color: '#a855f7', textColor: '#fff', score: 4 }, // Purple
  { id: 2, name: 'Moon', jpName: '衛星', label: 'Moon', radius: 30, color: '#cbd5e1', textColor: '#000', score: 8 },
  { id: 3, name: 'Earth', jpName: '地球', label: 'Earth', radius: 38, color: '#2563eb', textColor: '#fff', score: 16 }, // Blue-600
  { id: 4, name: 'Saturn', jpName: '土星', label: 'Saturn', radius: 48, color: '#4ade80', textColor: '#000', score: 32, hasRing: true }, // Green
  { id: 5, name: 'Gas Giant', jpName: '巨大ガス惑星', label: 'Gas', radius: 60, color: '#d97706', textColor: '#fff', score: 64 },
  { id: 6, name: 'Brown Dwarf', jpName: '褐色矮星', label: 'BD', radius: 72, color: '#78350f', textColor: '#fff', score: 128 },
  { id: 7, name: 'Star', jpName: '恒星', label: 'Star', radius: 85, color: '#facc15', textColor: '#000', score: 256 },
  { id: 8, name: 'Red Giant', jpName: '赤色巨星', label: 'RG', radius: 98, color: '#dc2626', textColor: '#fff', score: 512 },
  { id: 9, name: 'Neutron Star', jpName: '中性子星', label: 'NS', radius: 110, color: '#60a5fa', textColor: '#000', score: 1024 }, // Blue-400
  { id: 10, name: 'Black Hole', jpName: 'ブラックホール', label: 'BH', radius: 125, color: '#000000', textColor: '#fff', score: 2048 },
];

export const MAX_SPAWN_INDEX = 3; // Dust to Earth can spawn