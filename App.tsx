import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Building, Enemy, Item, ItemType, PlayerStats, Skill, Rarity } from './types';
import { 
  INITIAL_BUILDINGS, 
  INITIAL_SKILLS, 
  ITEM_POOL, 
  MONSTER_NAMES, 
  BOSS_NAMES, 
  RARITY_COLORS, 
  TRANSLATIONS 
} from './constants';
import { 
  Sword, 
  Scroll, 
  Coins, 
  ShoppingBag, 
  Backpack, 
  Zap,
  RefreshCw,
  Hammer,
  Paintbrush,
  Image as ImageIcon,
  Loader2,
  Skull,
  Languages
} from 'lucide-react';

// --- Helper Components ---

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-200 ${
      active 
        ? 'text-red-900 scale-105' 
        : 'text-stone-500 hover:text-stone-700'
    }`}
  >
    <div className={`p-2 rounded-full mb-1 border-2 ${active ? 'bg-red-100 border-red-900' : 'bg-transparent border-transparent'}`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`text-xs font-bold ${active ? 'font-ink text-base' : ''}`}>{label}</span>
  </button>
);

// --- AI Asset Component ---

const AssetCacheContext = React.createContext<{
  images: Record<string, string>;
  cacheImage: (key: string, data: string) => void;
}>({ images: {}, cacheImage: () => {} });

const InkAsset = ({ 
  storageKey, 
  subject, 
  fallbackIcon: Icon, 
  className = "", 
  size = 40,
  autoGenerate = false
}: { 
  storageKey: string; 
  subject: string; 
  fallbackIcon: any; 
  className?: string;
  size?: number;
  autoGenerate?: boolean;
}) => {
  const { images, cacheImage } = React.useContext(AssetCacheContext);
  const [loading, setLoading] = useState(false);
  const existingImage = images[storageKey];

  const generate = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLoading(true);

    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `Traditional Chinese ink wash painting of ${subject}. Sumi-e style, heavy black brush strokes, minimalist, negative space, white background, masterpiece, game icon` }]
        },
        config: {
          imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
        }
      });

      // Find image part
      for (const part of response.candidates?.[0]?.content?.parts || []) {
         if (part.inlineData) {
            const base64 = `data:image/png;base64,${part.inlineData.data}`;
            cacheImage(storageKey, base64);
            break;
         }
      }
    } catch (err) {
      console.error("Generation failed", err);
      if (JSON.stringify(err).includes("403") || JSON.stringify(err).includes("key")) {
         await window.aistudio.openSelectKey();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && !existingImage && !loading) {
      const timeout = setTimeout(() => generate(), Math.random() * 2000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate]);

  if (existingImage) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={existingImage} alt={subject} className="w-full h-full object-cover mix-blend-multiply" />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center bg-[#e6dcc5] ${className} group`}>
      {loading ? (
        <Loader2 className="animate-spin text-stone-500" size={size} />
      ) : (
        <>
          <Icon className="text-stone-400 group-hover:opacity-20 transition-opacity" size={size} />
          <button 
            onClick={generate}
            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity"
            title="Generate Ink Painting"
          >
            <Paintbrush className="text-stone-800 drop-shadow-md" size={Math.max(16, size / 2)} />
            {size > 40 && <span className="text-[10px] font-bold text-stone-900 bg-[#f0e6d2] px-1 rounded mt-1">Paint</span>}
          </button>
        </>
      )}
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  // --- State ---
  const [lang, setLang] = useState<'en'|'zh'>('zh');
  const [activeTab, setActiveTab] = useState<'combat'|'skills'|'invest'|'shop'|'inventory'>('combat');
  const [lastTick, setLastTick] = useState<number>(Date.now());
  const [assetCache, setAssetCache] = useState<Record<string, string>>({});
  
  // Player Stats
  const [stats, setStats] = useState<PlayerStats>({
    gold: 10000000, 
    damage: 10,
    autoDamage: 0,
    luck: 0,
    craftsmanship: 0,
    stage: 1,
  });

  // Progression
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  
  // Combat
  const [currentBoss, setCurrentBoss] = useState<Enemy|null>(null); // Persistent boss for current stage
  const [enemy, setEnemy] = useState<Enemy | null>(null); // Currently displayed enemy (minion or boss)
  const [isBossFight, setIsBossFight] = useState(false);
  const [clicks, setClicks] = useState<{id: number, x: number, y: number, val: number}[]>([]);

  // --- Context Value ---
  const cacheContextValue = {
    images: assetCache,
    cacheImage: (key: string, data: string) => {
      setAssetCache(prev => ({ ...prev, [key]: data }));
    }
  };

  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  // --- Calculations ---

  const calculatedStats = useMemo(() => {
    let dmg = 10;
    let auto = 0;
    let luck = 0;
    let craft = 0;
    let goldMult = 1;

    skills.forEach(s => {
      if (s.type === 'attack') dmg += s.level * s.effectPerLevel;
      if (s.type === 'speed') auto += s.level * s.effectPerLevel; 
    });

    inventory.forEach(item => {
      if (item.effects) {
        if (item.effects.attackFlat) dmg += item.effects.attackFlat;
        if (item.effects.attackPercent) dmg *= (1 + item.effects.attackPercent);
        if (item.effects.luck) luck += item.effects.luck;
        if (item.effects.craftsmanship) craft += item.effects.craftsmanship;
        if (item.effects.goldRate) goldMult += item.effects.goldRate;
      }
    });

    const passiveGold = buildings.reduce((acc, b) => acc + (b.baseIncome * b.level), 0);

    return {
      finalDamage: Math.floor(dmg),
      finalAuto: Math.floor(auto),
      finalLuck: luck,
      finalCraft: craft,
      passiveGold: passiveGold * goldMult,
    };
  }, [skills, inventory, buildings]);

  // --- Game Logic ---

  useEffect(() => {
    refreshShop();
    generateStageBoss(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateStageBoss = (stageLvl: number) => {
    const baseHp = 50 * Math.pow(1.5, stageLvl) * 10;
    const name = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];
    const boss: Enemy = {
      id: `boss-${stageLvl}-${Date.now()}`,
      name: name,
      maxHp: Math.floor(baseHp),
      currentHp: Math.floor(baseHp),
      level: stageLvl,
      isBoss: true
    };
    setCurrentBoss(boss);
  };

  const spawnEnemy = useCallback(() => {
    if (isBossFight && currentBoss) {
      // Spawn the existing boss state (or reset it if we want it to heal on fail, for now let's persist HP)
      setEnemy(currentBoss);
    } else {
      // Spawn Random Minion
      const baseHp = 50 * Math.pow(1.5, stats.stage); // Scalling
      const name = MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];
      setEnemy({
        id: `minion-${Date.now()}`,
        name: name,
        maxHp: Math.floor(baseHp),
        currentHp: Math.floor(baseHp),
        level: stats.stage,
        isBoss: false
      });
    }
  }, [stats.stage, isBossFight, currentBoss]);

  useEffect(() => {
    // If enemy dies or mode changes, respawn
    if (!enemy) spawnEnemy();
    // Also if we switch to boss fight, we need to force switch
    if (isBossFight && enemy && !enemy.isBoss && currentBoss) {
      setEnemy(currentBoss);
    }
    // If we switch away from boss fight
    if (!isBossFight && enemy && enemy.isBoss) {
      setEnemy(null); // Will trigger respawn of minion
    }
  }, [enemy, isBossFight, currentBoss, spawnEnemy]);

  // Sync current boss HP back to state if we are fighting him
  useEffect(() => {
    if (isBossFight && enemy && enemy.isBoss) {
      setCurrentBoss(enemy);
    }
  }, [enemy, isBossFight]);


  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTick) / 1000;
      
      if (delta >= 1) {
        setLastTick(now);
        
        if (calculatedStats.passiveGold > 0) {
          setStats(prev => ({ ...prev, gold: prev.gold + calculatedStats.passiveGold }));
        }

        if (calculatedStats.finalAuto > 0 && enemy && enemy.currentHp > 0) {
          handleDamage(calculatedStats.finalAuto, false);
        }
      }
    }, 100); 

    return () => clearInterval(timer);
  }, [lastTick, calculatedStats.passiveGold, calculatedStats.finalAuto, enemy]);

  const handleDamage = (amount: number, isClick: boolean) => {
    if (!enemy) return;

    setEnemy(prev => {
      if (!prev) return null;
      const newHp = prev.currentHp - amount;
      
      if (newHp <= 0) {
        // Enemy Defeated
        const dropGold = Math.floor(prev.maxHp * 0.1); // Gold drop
        
        // Update Gold
        setStats(s => ({ ...s, gold: s.gold + dropGold }));

        if (prev.isBoss) {
          // Boss Defeated!
          setStats(s => ({ ...s, stage: s.stage + 1 }));
          setIsBossFight(false);
          generateStageBoss(stats.stage + 1); // Generate next boss
          return null; // Will trigger spawnEnemy(minion)
        } else {
          // Minion Defeated
          return null; // Will trigger spawnEnemy(minion)
        }
      }
      return { ...prev, currentHp: newHp };
    });
  };

  const handleManualClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enemy) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setClicks(prev => [...prev, { id: Date.now(), x, y, val: calculatedStats.finalDamage }]);
    setTimeout(() => {
      setClicks(prev => prev.slice(1));
    }, 800);

    handleDamage(calculatedStats.finalDamage, true);
  };

  const refreshShop = () => {
    const count = 6;
    const newItems = [];
    for(let i=0; i<count; i++) {
      const roll = Math.random();
      const luckFactor = calculatedStats.finalLuck * 0.001;
      
      // Determine rarity based on luck
      let rarity = Rarity.COMMON;
      const r = roll - luckFactor;
      if (r > 0.98) rarity = Rarity.LEGENDARY;
      else if (r > 0.90) rarity = Rarity.EPIC;
      else if (r > 0.75) rarity = Rarity.RARE;
      else if (r > 0.50) rarity = Rarity.UNCOMMON;

      // Filter pool by rarity preference (simplistic: just pick random from pool and upgrade its stats/rarity visually if needed, 
      // or filter pool. For this MVP, let's just pick from pool and overwrite rarity/price to match the "roll")
      
      const template = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
      
      // Dynamic price multiplier based on rarity
      let priceMult = 1;
      if (rarity === Rarity.UNCOMMON) priceMult = 5;
      if (rarity === Rarity.RARE) priceMult = 20;
      if (rarity === Rarity.EPIC) priceMult = 100;
      if (rarity === Rarity.LEGENDARY) priceMult = 500;

      newItems.push({
        ...template, 
        id: `${template.id}-${Date.now()}-${i}`,
        rarity: rarity, // Overwrite rarity for the 'drop' feel
        price: template.price * priceMult,
        name: `${rarity !== template.rarity ? `[${rarity.toUpperCase()}] ` : ''}${template.name}`
      });
    }
    setShopItems(newItems);
  };

  const buyItem = (item: Item, index: number) => {
    if (stats.gold >= item.price) {
      setStats(s => ({ ...s, gold: s.gold - item.price }));
      setInventory(prev => [...prev, item]);
      
      const newShop = [...shopItems];
      newShop.splice(index, 1);
      setShopItems(newShop);
    }
  };

  const upgradeSkill = (skillId: string) => {
    const skillIdx = skills.findIndex(s => s.id === skillId);
    if (skillIdx === -1) return;
    
    const skill = skills[skillIdx];
    const cost = Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, skill.level));
    
    if (stats.gold >= cost) {
      setStats(s => ({ ...s, gold: s.gold - cost }));
      const newSkills = [...skills];
      newSkills[skillIdx] = { ...skill, level: skill.level + 1 };
      setSkills(newSkills);
    }
  };

  const upgradeBuilding = (buildingId: string) => {
    const idx = buildings.findIndex(b => b.id === buildingId);
    if (idx === -1) return;
    
    const b = buildings[idx];
    const cost = Math.floor(b.baseCost * Math.pow(b.costMultiplier, b.level));
    
    if (stats.gold >= cost) {
      setStats(s => ({ ...s, gold: s.gold - cost }));
      const newBuildings = [...buildings];
      newBuildings[idx] = { ...b, level: b.level + 1 };
      setBuildings(newBuildings);
    }
  };

  const synthesizeScroll = () => {
    const hasTop = inventory.find(i => i.name.includes('(Top)'));
    const hasBot = inventory.find(i => i.name.includes('(Bot)'));
    
    if (hasTop && hasBot) {
      const newInv = inventory.filter(i => i !== hasTop && i !== hasBot);
      newInv.push({
        id: 'completed_scroll',
        name: 'Ancient Secret Art',
        description: 'A completed masterpiece.',
        type: ItemType.ARTIFACT,
        rarity: Rarity.LEGENDARY,
        price: 0,
        effects: { attackPercent: 0.5, luck: 20 }
      });
      setInventory(newInv);
    }
  };

  // --- Render Views ---

  const renderCombat = () => (
    <div className="flex flex-col items-center h-full p-4 relative overflow-hidden">
      {/* Level Info */}
      <div className="w-full text-center mt-4 mb-8 relative z-10">
        <h2 className="text-2xl font-ink text-stone-800">{t('stage')} {stats.stage}</h2>
        <p className="text-stone-500 text-sm font-serif italic mt-1">
          {enemy?.isBoss ? t('boss') : t('minion')}
        </p>
      </div>

      {/* Monster Area */}
      <div 
        className="relative w-72 h-72 flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform"
        onClick={handleManualClick}
      >
        {/* Ink Circle Effect */}
        <div className={`absolute inset-0 border-[6px] rounded-full opacity-80 transition-colors duration-500
          ${enemy?.isBoss ? 'border-red-800 animate-pulse' : 'border-stone-800'}`}>
           <div className="absolute -top-2 left-10 w-20 h-2 bg-[#f0e6d2] rotate-12"></div>
           <div className="absolute bottom-4 right-10 w-16 h-2 bg-[#f0e6d2] -rotate-12"></div>
        </div>

        {enemy ? (
          <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
            {/* Monster Image */}
            <div className={`w-48 h-48 rounded-full shadow-inner flex items-center justify-center overflow-hidden mb-2 mask-ink bg-white`}>
               <InkAsset 
                 storageKey={enemy.isBoss ? `boss_${enemy.name}_${enemy.id}` : `monster_${enemy.name}`} 
                 subject={enemy.name + (enemy.isBoss ? " Boss Monster, fierce, demonic" : " enemy, weak, minion")} 
                 fallbackIcon={enemy.isBoss ? Skull : Sword}
                 size={64}
                 className="w-full h-full"
                 autoGenerate={true}
               />
            </div>
            
            {/* Health Bar */}
            <div className="w-48 h-4 bg-stone-300 border-2 border-stone-800 rounded-full overflow-hidden mt-[-10px] relative z-20">
              <div 
                className={`h-full transition-all duration-200 ${enemy.isBoss ? 'bg-red-700' : 'bg-stone-700'}`}
                style={{ width: `${Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)}%` }}
              ></div>
            </div>
            <div className="font-ink text-xl text-stone-900 mt-1 bg-[#f0e6d2]/80 px-2 rounded">
               {enemy.currentHp} / {enemy.maxHp}
            </div>
          </div>
        ) : (
          <div className="font-ink text-stone-400 text-xl animate-pulse">{t('searching')}</div>
        )}

        {/* Floating Numbers */}
        {clicks.map(click => (
          <div 
            key={click.id}
            className="absolute text-4xl font-bold text-red-700 pointer-events-none animate-float-up font-ink z-30"
            style={{ left: click.x, top: click.y }}
          >
            -{click.val}
          </div>
        ))}
      </div>

      {/* Boss Challenge Button (Bottom Right) */}
      {!isBossFight && currentBoss && (
        <div className="absolute bottom-24 right-4 z-20 flex flex-col items-end">
          <button 
            onClick={() => setIsBossFight(true)}
            className="w-20 h-20 rounded-full border-4 border-red-900 bg-stone-800 relative overflow-hidden shadow-lg shadow-stone-900 active:scale-95 transition-transform group"
          >
            <InkAsset 
               storageKey={`boss_avatar_${currentBoss.name}`}
               subject={`${currentBoss.name} face, chinese painting`}
               fallbackIcon={Skull}
               size={32}
               className="w-full h-full opacity-80 group-hover:opacity-100"
               autoGenerate={true}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
              <span className="font-ink text-white text-xl drop-shadow-md border-b border-red-500">{t('boss_challenge')}</span>
            </div>
            {/* Wanted Tag */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-red-700 text-[#f0e6d2] text-[8px] px-1 rounded">
               WANTED
            </div>
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-auto mb-4 w-full grid grid-cols-2 gap-4">
         <div className="bg-[#e6dcc5] p-3 rounded border-2 border-stone-800/20 text-center">
            <div className="text-stone-500 text-xs uppercase">{t('power')}</div>
            <div className="font-bold text-lg font-serif">{calculatedStats.finalDamage}</div>
         </div>
         <div className="bg-[#e6dcc5] p-3 rounded border-2 border-stone-800/20 text-center">
            <div className="text-stone-500 text-xs uppercase">{t('gold')}/Sec</div>
            <div className="font-bold text-lg font-serif">{calculatedStats.passiveGold}</div>
         </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="p-4 space-y-4 pb-20 overflow-y-auto h-full">
      <h2 className="text-3xl font-ink text-center mb-6 border-b-2 border-stone-800 pb-2">{t('kungfu')}</h2>
      {skills.map(skill => {
        const cost = Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, skill.level));
        const canAfford = stats.gold >= cost;
        const colors = RARITY_COLORS[skill.rarity];
        
        return (
          <div key={skill.id} className={`p-4 rounded-lg border-2 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] flex justify-between items-center ${colors.bg} ${colors.border} ${colors.shadow}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded border ${colors.border} bg-white`}>
                <InkAsset 
                   storageKey={`skill_${skill.name}`}
                   subject={`${skill.name}, martial arts technique book or stance`}
                   fallbackIcon={Zap}
                   size={32}
                   className="w-10 h-10"
                   autoGenerate={true}
                />
              </div>
              <div>
                <h3 className={`text-xl font-bold font-ink ${colors.text}`}>{skill.name} <span className="text-sm font-serif text-stone-600">Lv.{skill.level}</span></h3>
                <p className="text-stone-600 text-xs font-serif mt-1">{skill.description}</p>
                <p className="text-stone-500 text-xs mt-1">{t('effect')}: +{skill.effectPerLevel} {skill.type}</p>
              </div>
            </div>
            <button 
              onClick={() => upgradeSkill(skill.id)}
              disabled={!canAfford}
              className={`px-4 py-2 rounded font-bold border-2 transition-transform active:scale-95 flex flex-col items-center min-w-[80px]
                ${canAfford ? 'bg-stone-800 text-[#f0e6d2] border-stone-900 hover:bg-black' : 'bg-stone-400 text-stone-200 border-stone-500 cursor-not-allowed'}
              `}
            >
              <span className="text-sm">{t('train')}</span>
              <span className="text-xs flex items-center gap-1 mt-1 text-yellow-500">
                <Coins size={10} /> {cost}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  );

  const renderInvest = () => (
    <div className="p-4 space-y-4 pb-20 overflow-y-auto h-full">
      <h2 className="text-3xl font-ink text-center mb-6 border-b-2 border-stone-800 pb-2">{t('invest')}</h2>
      {buildings.map(b => {
        const cost = Math.floor(b.baseCost * Math.pow(b.costMultiplier, b.level));
        const canAfford = stats.gold >= cost;
        return (
          <div key={b.id} className="relative overflow-hidden bg-[#e8dec6] p-4 rounded-lg border-2 border-stone-800 shadow-[4px_4px_0px_#292524]">
             {/* Background Decoration */}
             <div className="absolute right-0 top-0 w-32 h-32 opacity-20 pointer-events-none mix-blend-multiply">
                <InkAsset 
                  storageKey={`building_${b.name}`}
                  subject={`Ancient Chinese ${b.name}, architecture`}
                  fallbackIcon={ShoppingBag}
                  size={64}
                  className="w-full h-full"
                  autoGenerate={true}
                />
             </div>
             
             <div className="relative z-10 flex justify-between items-center">
               <div>
                  <h3 className="text-xl font-bold font-ink text-stone-900">{b.name} <span className="bg-stone-800 text-[#f0e6d2] text-xs px-1 rounded ml-2">Lv.{b.level}</span></h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-800">
                      +{b.baseIncome * b.level}/sec
                    </span>
                  </div>
               </div>
               <button 
                  onClick={() => upgradeBuilding(b.id)}
                  disabled={!canAfford}
                  className={`px-4 py-3 rounded font-bold border-2 transition-transform active:scale-95 flex flex-col items-center min-w-[90px]
                    ${canAfford ? 'bg-stone-800 text-[#f0e6d2] border-black' : 'bg-stone-400 text-stone-200 border-stone-500'}
                  `}
                >
                  <span className="text-sm">{t('upgrade')}</span>
                  <span className="text-xs flex items-center gap-1 mt-1 text-yellow-500">
                    <Coins size={10} /> {cost}
                  </span>
                </button>
             </div>
          </div>
        )
      })}
    </div>
  );

  const renderShop = () => (
    <div className="p-4 flex flex-col h-full pb-20">
      <div className="flex justify-between items-end mb-4 border-b-2 border-stone-800 pb-2">
         <div className="text-left">
            <h2 className="text-3xl font-ink">{t('shop')}</h2>
            <p className="text-xs text-stone-500">{t('luck')}: {calculatedStats.finalLuck}</p>
         </div>
         <button 
            onClick={refreshShop}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1 bg-stone-800 text-white rounded-full active:scale-95"
          >
            <RefreshCw size={12} /> {t('refresh')}
         </button>
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto">
        {shopItems.map((item, idx) => {
          const canAfford = stats.gold >= item.price;
          const colors = RARITY_COLORS[item.rarity];
          
          return (
            <div key={item.id} className={`p-3 rounded flex flex-col justify-between h-56 border-2 transition-colors relative group ${colors.bg} ${colors.border}`}>
               {/* Item Rarity Glow */}
               <div className={`absolute top-2 right-2 w-2 h-2 rounded-full z-10 ${colors.glow}`}></div>

               <div className="flex-1 flex flex-col items-center justify-center text-center w-full overflow-hidden">
                  <div className={`mb-2 w-24 h-24 rounded border ${colors.border} bg-white`}>
                      <InkAsset 
                        storageKey={`item_${item.name.replace(/\[.*?\]/g, '').trim()}`} // remove rarity tag from prompt key
                        subject={`object ${item.name.replace(/\[.*?\]/g, '').trim()}, chinese ink painting`}
                        fallbackIcon={item.type === ItemType.WEAPON ? Sword : item.type === ItemType.ARTIFACT ? Hammer : item.type === ItemType.MATERIAL ? Scroll : Zap}
                        size={32}
                        className="w-full h-full"
                        autoGenerate={true}
                      />
                  </div>
                  <h4 className={`font-bold text-sm leading-tight ${colors.text}`}>{item.name}</h4>
                  <p className="text-[10px] text-stone-500 mt-1 line-clamp-2">{item.description}</p>
               </div>

               <button 
                 onClick={() => buyItem(item, idx)}
                 disabled={!canAfford}
                 className={`w-full mt-2 py-1 text-xs font-bold rounded border ${
                   canAfford 
                   ? 'bg-yellow-100 border-yellow-600 text-yellow-900 hover:bg-yellow-200' 
                   : 'bg-stone-200 text-stone-400 border-stone-300'
                 }`}
               >
                 {item.price} {t('gold')}
               </button>
            </div>
          )
        })}
      </div>
    </div>
  );

  const renderInventory = () => {
    const canSynthesize = inventory.some(i => i.name.includes('(Top)')) && inventory.some(i => i.name.includes('(Bot)'));

    return (
      <div className="p-4 h-full flex flex-col pb-20">
         <h2 className="text-3xl font-ink text-center mb-6 border-b-2 border-stone-800 pb-2">{t('bag')} ({inventory.length}/40)</h2>
         
         {/* Stats Summary */}
         <div className="bg-[#e8dec6] p-4 rounded mb-4 text-xs font-serif grid grid-cols-2 gap-y-2 border-2 border-dashed border-stone-400">
            <div>ATK: <span className="font-bold text-stone-900">+{calculatedStats.finalDamage - 10}</span></div>
            <div>{t('luck')}: <span className="font-bold text-stone-900">{calculatedStats.finalLuck}</span></div>
            <div>{t('craft')}: <span className="font-bold text-stone-900">{calculatedStats.finalCraft}</span></div>
            <div>{t('gold')}+: <span className="font-bold text-stone-900">{Math.round((calculatedStats.passiveGold / (buildings.reduce((a,b)=>a + b.baseIncome * b.level, 0) || 1) - 1) * 100)}%</span></div>
         </div>

         {/* Synthesis Button */}
         {canSynthesize && (
           <button 
             onClick={synthesizeScroll}
             className="w-full mb-4 bg-purple-100 border-2 border-purple-800 text-purple-900 py-3 rounded font-bold font-ink animate-pulse"
            >
              {t('synthesize')}
           </button>
         )}

         {/* Grid */}
         <div className="grid grid-cols-4 gap-2 overflow-y-auto content-start flex-1">
            {inventory.map((item, idx) => {
               const colors = RARITY_COLORS[item.rarity];
               return (
                <div key={idx} className={`aspect-square ${colors.bg} border ${colors.border} rounded p-1 flex items-center justify-center relative hover:bg-white hover:border-stone-800 group overflow-hidden`}>
                   {/* Icon */}
                   <InkAsset 
                      storageKey={`item_${item.name.replace(/\[.*?\]/g, '').trim()}`}
                      subject={`object ${item.name}, chinese ink painting`}
                      fallbackIcon={item.type === ItemType.WEAPON ? Sword : item.type === ItemType.ARTIFACT ? Hammer : item.type === ItemType.MATERIAL ? Scroll : Zap}
                      size={24}
                      className="w-full h-full"
                      autoGenerate={false}
                    />
                   {/* Tooltip */}
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-stone-900 text-[#f0e6d2] text-[10px] p-2 rounded hidden group-hover:block z-50 pointer-events-none border border-[#f0e6d2]">
                      <div className={`font-bold mb-1 border-b border-stone-700 pb-1 ${colors.text === 'text-stone-800' ? 'text-white' : colors.text.replace('800', '400')}`}>{item.name}</div>
                      <div>{item.description}</div>
                   </div>
                </div>
              );
            })}
            {/* Empty Slots Filler */}
            {Array.from({ length: Math.max(0, 20 - inventory.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-stone-200/50 rounded border border-stone-300/50"></div>
            ))}
         </div>
      </div>
    );
  }

  return (
    <AssetCacheContext.Provider value={cacheContextValue}>
      <div className="flex justify-center min-h-screen bg-stone-900 font-serif">
        <div className="w-full max-w-md h-[100dvh] bg-[#f0e6d2] relative shadow-2xl flex flex-col overflow-hidden">
          
          {/* Top Bar */}
          <div className="h-16 bg-[#e6dcc5] flex items-center justify-between px-4 border-b-4 border-stone-800 z-10 shadow-md">
            {/* Power Level */}
            <div className="relative">
              <div className="absolute -left-2 -top-2 w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-[#f0e6d2] font-ink border-2 border-[#f0e6d2] text-xl z-10">
                {t('power')[0]}
              </div>
              <div className="bg-stone-800 text-[#f0e6d2] pl-8 pr-3 py-1 rounded-r-full text-sm font-bold min-w-[100px]">
                {calculatedStats.finalDamage.toLocaleString()}
              </div>
            </div>

             {/* Language Toggle */}
            <button 
               onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
               className="p-2 bg-stone-800 text-[#f0e6d2] rounded-full hover:scale-105 active:scale-95 transition-transform"
               title="Switch Language"
            >
               {lang === 'zh' ? 'A' : '文'}
            </button>

            {/* Gold */}
            <div className="flex items-center gap-2 bg-stone-800/10 px-3 py-1 rounded-full border border-stone-800/20">
              <div className="bg-yellow-500 rounded-full p-1 border border-yellow-700 text-yellow-900">
                <Coins size={14} />
              </div>
              <span className="font-bold text-stone-900 font-mono tracking-tighter">
                {Math.floor(stats.gold).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/paper.png')]">
            {activeTab === 'combat' && renderCombat()}
            {activeTab === 'skills' && renderSkills()}
            {activeTab === 'invest' && renderInvest()}
            {activeTab === 'shop' && renderShop()}
            {activeTab === 'inventory' && renderInventory()}
          </div>

          {/* Bottom Navigation */}
          <div className="h-20 bg-[#e6dcc5] border-t-4 border-stone-800 flex items-stretch z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
            <TabButton active={activeTab === 'combat'} onClick={() => setActiveTab('combat')} icon={Sword} label={t('battle')} />
            <TabButton active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} icon={Zap} label={t('kungfu')} />
            <TabButton active={activeTab === 'invest'} onClick={() => setActiveTab('invest')} icon={Coins} label={t('invest')} />
            <TabButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={ShoppingBag} label={t('shop')} />
            <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={Backpack} label={t('bag')} />
          </div>

        </div>

        <style>{`
          @keyframes float-up {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-40px) scale(1.5); }
          }
          .animate-float-up {
            animation: float-up 0.8s ease-out forwards;
          }
          .mask-ink {
            mask-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwIDBDNDAgMCAwIDQwIDAgMTAwczQwIDEwMCAxMDAgMTAwIDEwMC00MCAxMDAtMTAwUzE2MCAwIDEwMCAweiIvPjwvc3ZnPg==');
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
          }
        `}</style>
      </div>
    </AssetCacheContext.Provider>
  );
}