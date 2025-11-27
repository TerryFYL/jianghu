import { Building, Item, ItemType, Rarity, Skill } from './types';

export const RARITY_COLORS = {
  [Rarity.COMMON]: {
    border: 'border-stone-800',
    text: 'text-stone-800',
    bg: 'bg-stone-100',
    shadow: 'shadow-stone-900',
    glow: 'bg-stone-500'
  },
  [Rarity.UNCOMMON]: {
    border: 'border-green-800',
    text: 'text-green-800',
    bg: 'bg-green-50',
    shadow: 'shadow-green-900',
    glow: 'bg-green-500'
  },
  [Rarity.RARE]: {
    border: 'border-pink-600',
    text: 'text-pink-700',
    bg: 'bg-pink-50',
    shadow: 'shadow-pink-900',
    glow: 'bg-pink-500'
  },
  [Rarity.EPIC]: {
    border: 'border-orange-600',
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    shadow: 'shadow-orange-900',
    glow: 'bg-orange-500'
  },
  [Rarity.LEGENDARY]: {
    border: 'border-red-700',
    text: 'text-red-800',
    bg: 'bg-red-50',
    shadow: 'shadow-red-900',
    glow: 'bg-red-600'
  }
};

// Initial Buildings
export const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'b1',
    name: 'Tea House',
    description: 'A small place to rest and gather gossip.',
    level: 0,
    baseCost: 100,
    baseIncome: 5,
    costMultiplier: 1.15,
  },
  {
    id: 'b2',
    name: 'Tavern',
    description: 'Where heroes meet and money flows.',
    level: 0,
    baseCost: 1000,
    baseIncome: 45,
    costMultiplier: 1.15,
  },
  {
    id: 'b3',
    name: 'Money House',
    description: 'The center of finance in the city.',
    level: 0,
    baseCost: 12000,
    baseIncome: 300,
    costMultiplier: 1.2,
  },
];

// Initial Skills with Rarity
export const INITIAL_SKILLS: Skill[] = [
  {
    id: 's1',
    name: 'Basic Fist',
    description: 'The foundation of all martial arts.',
    level: 1,
    baseCost: 50,
    costMultiplier: 1.4,
    effectPerLevel: 5,
    type: 'attack',
    rarity: Rarity.COMMON,
  },
  {
    id: 's2',
    name: 'Iron Skin',
    description: 'Harden your body against impact.',
    level: 0,
    baseCost: 200,
    costMultiplier: 1.5,
    effectPerLevel: 10,
    type: 'attack',
    rarity: Rarity.UNCOMMON,
  },
  {
    id: 's3',
    name: 'Wind Steps',
    description: 'Move like the wind.',
    level: 0,
    baseCost: 1000,
    costMultiplier: 1.6,
    effectPerLevel: 2, // speed
    type: 'speed',
    rarity: Rarity.RARE,
  },
  {
    id: 's4',
    name: 'Dragon Palm',
    description: 'Strike with the force of a dragon.',
    level: 0,
    baseCost: 5000,
    costMultiplier: 1.8,
    effectPerLevel: 50,
    type: 'attack',
    rarity: Rarity.EPIC,
  },
  {
    id: 's5',
    name: 'Nine Suns Art',
    description: 'The ultimate internal cultivation.',
    level: 0,
    baseCost: 50000,
    costMultiplier: 2.0,
    effectPerLevel: 200,
    type: 'attack',
    rarity: Rarity.LEGENDARY,
  },
];

// Item Pool for Shop
export const ITEM_POOL: Item[] = [
  {
    id: 'i1',
    name: 'Wooden Chair',
    description: 'Simple comfort. Adds Craftsmanship.',
    type: ItemType.ARTIFACT,
    rarity: Rarity.COMMON,
    price: 500,
    effects: { craftsmanship: 5 },
  },
  {
    id: 'i2',
    name: 'Iron Sword',
    description: 'A standard blade.',
    type: ItemType.WEAPON,
    rarity: Rarity.COMMON,
    price: 800,
    effects: { attackFlat: 25 },
  },
  {
    id: 'i3',
    name: 'Bamboo Scroll (Top)',
    description: 'Part of an ancient text.',
    type: ItemType.MATERIAL,
    rarity: Rarity.UNCOMMON,
    price: 2000,
    partOf: 'scroll_ancient',
  },
  {
    id: 'i4',
    name: 'Bamboo Scroll (Bot)',
    description: 'Part of an ancient text.',
    type: ItemType.MATERIAL,
    rarity: Rarity.UNCOMMON,
    price: 2000,
    partOf: 'scroll_ancient',
  },
  {
    id: 'i5',
    name: 'Jade Pendant',
    description: 'Brings good fortune.',
    type: ItemType.ARTIFACT,
    rarity: Rarity.RARE,
    price: 5000,
    effects: { luck: 10 },
  },
  {
    id: 'i6',
    name: 'Dragon Well Tea',
    description: 'Increases gold production slightly.',
    type: ItemType.CONSUMABLE,
    rarity: Rarity.RARE,
    price: 1500,
    effects: { goldRate: 0.1 },
  },
  {
    id: 'i7',
    name: 'Red Ink Stone',
    description: 'Essential for high level calligraphy.',
    type: ItemType.MATERIAL,
    rarity: Rarity.EPIC,
    price: 15000,
    effects: { craftsmanship: 50 },
  },
  {
    id: 'i8',
    name: 'Phoenix Feather',
    description: 'A legendary material burning with eternal fire.',
    type: ItemType.ARTIFACT,
    rarity: Rarity.LEGENDARY,
    price: 100000,
    effects: { attackPercent: 1.0 },
  },
    {
    id: 'i9',
    name: 'Tiger Tally',
    description: 'Commands the armies of the west.',
    type: ItemType.ARTIFACT,
    rarity: Rarity.EPIC,
    price: 25000,
    effects: { attackFlat: 500 },
  },
];

export const MONSTER_NAMES = [
  'Rogue Thief', 'Wild Wolf', 'Bandit', 'Corrupt Guard', 'Swordsman', 'Iron Golem', 'Shadow Assassin', 'Forest Spirit', 'Drunken Master'
];

export const BOSS_NAMES = [
  'Wolf King', 'Tiger General', 'Demon of the North', 'Blood Monk', 'Jade Emperor\'s Shadow', 'Void Dragon'
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    power: 'Power',
    gold: 'Gold',
    stage: 'Stage',
    battle: 'Battle',
    kungfu: 'Kung Fu',
    invest: 'Invest',
    shop: 'Shop',
    bag: 'Bag',
    refresh: 'Refresh',
    buy: 'Buy',
    train: 'Train',
    upgrade: 'Upgrade',
    synthesize: 'Synthesize',
    boss_challenge: 'Boss Challenge',
    minion: 'Minion',
    boss: 'Boss',
    searching: 'Searching...',
    luck: 'Luck',
    craft: 'Craft',
    effect: 'Effect',
    cost: 'Cost',
    income: 'Income',
    boss_warning: 'Challenge the Boss?',
    boss_desc: 'Defeat to advance to next stage.',
    painting: 'Paint'
  },
  zh: {
    power: '战力',
    gold: '铜钱',
    stage: '关卡',
    battle: '游历',
    kungfu: '功法',
    invest: '产业',
    shop: '集市',
    bag: '背包',
    refresh: '刷新',
    buy: '购买',
    train: '修炼',
    upgrade: '升级',
    synthesize: '合成',
    boss_challenge: '通缉',
    minion: '杂鱼',
    boss: '首领',
    searching: '寻觅中...',
    luck: '气运',
    craft: '工艺',
    effect: '效果',
    cost: '消耗',
    income: '收益',
    boss_warning: '挑战首领？',
    boss_desc: '击败首领进入下一关',
    painting: '作画'
  }
};