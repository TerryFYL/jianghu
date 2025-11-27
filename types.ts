export enum Rarity {
  COMMON = 'common',     // Black/Gray
  UNCOMMON = 'uncommon', // Green
  RARE = 'rare',         // Pink
  EPIC = 'epic',         // Orange
  LEGENDARY = 'legendary', // Red
}

export enum ItemType {
  MATERIAL = 'material', // For synthesis
  ARTIFACT = 'artifact', // Passive stats in bag
  WEAPON = 'weapon', // Needs equipping (simplified to passive for MVP)
  CONSUMABLE = 'consumable', // Immediate effect
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  price: number;
  effects?: {
    attackFlat?: number;
    attackPercent?: number;
    luck?: number; // Increases shop quality
    craftsmanship?: number; // Synthesis success rate (flavor for MVP)
    goldRate?: number;
  };
  partOf?: string; // For synthesis (e.g., 'scroll_1')
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  baseCost: number;
  costMultiplier: number;
  effectPerLevel: number; // e.g., +5 attack
  type: 'attack' | 'speed' | 'crit';
  rarity: Rarity;
}

export interface Building {
  id: string;
  name: string;
  description: string;
  level: number;
  baseCost: number;
  baseIncome: number; // Gold per second
  costMultiplier: number;
}

export interface PlayerStats {
  gold: number;
  damage: number; // Click damage
  autoDamage: number; // DPS
  luck: number;
  craftsmanship: number;
  stage: number;
}

export interface Enemy {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  level: number;
  isBoss: boolean;
}