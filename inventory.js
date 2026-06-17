/* ═══════════════════════════════════════════════════════
   INVENTORY.JS — Gestion de l'inventaire & équipement
═══════════════════════════════════════════════════════ */

const Inventory = (() => {

  // ── RARETÉS ──────────────────────────────────────────
  const RARITY = {
    common    : { label: 'Commun',    color: '#aaaaaa', multiplier: 1.0 },
    rare      : { label: 'Rare',      color: '#4488ff', multiplier: 1.4 },
    epic      : { label: 'Épique',    color: '#aa44ff', multiplier: 1.9 },
    legendary : { label: 'Légendaire',color: '#ffaa00', multiplier: 2.6 },
  };

  // ── BASE DES ARMES ───────────────────────────────────
  const WEAPONS = {
    sword_1h: {
      id: 'sword_1h', name: 'Épée Une Main', type: 'weapon',
      icon: '⚔️', baseDmg: 15, speed: 1.0, range: 55,
    },
    dual_swords: {
      id: 'dual_swords', name: 'Double Épées', type: 'weapon',
      icon: '⚔️⚔️', baseDmg: 11, speed: 1.6, range: 45,
    },
    bow: {
      id: 'bow', name: 'Arc', type: 'weapon',
      icon: '🏹', baseDmg: 18, speed: 0.7, range: 180,
    },
  };

  // ── BASE DES ARMURES ─────────────────────────────────
  const ARMORS = {
    light: {
      id: 'light', name: 'Armure Légère', type: 'armor',
      icon: '🧥', baseDef: 5, hpBonus: 10,
    },
    medium: {
      id: 'medium', name: 'Cotte de Mailles', type: 'armor',
      icon: '🛡️', baseDef: 12, hpBonus: 25,
    },
    heavy: {
      id: 'heavy', name: 'Armure Lourde', type: 'armor',
      icon: '⚙️', baseDef: 22, hpBonus: 50,
    },
  };

  /** Crée un item avec sa rareté */
  function createItem(baseId, rarityKey = 'common') {
    const bases = { ...WEAPONS, ...ARMORS };
    const base   = bases[baseId];
    if (!base) return null;
    const rarity = RARITY[rarityKey] || RARITY.common;
    const mult   = rarity.multiplier;

    const item = {
      uid     : `${baseId}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      ...base,
      rarity  : rarityKey,
      rarityLabel : rarity.label,
      rarityColor : rarity.color,
    };

    if (base.type === 'weapon') {
      item.damage = Math.round(base.baseDmg * mult);
      item.speed  = +(base.speed * (rarityKey === 'legendary' ? 1.15 : 1)).toFixed(2);
      item.range  = Math.round(base.range * (mult > 1.5 ? 1.1 : 1));
    } else {
      item.defense = Math.round(base.baseDef * mult);
      item.hpBonus = Math.round(base.hpBonus * mult);
    }

    return item;
  }

  /** Tire une rareté aléatoire selon les probabilités */
  function rollRarity(floorBonus = 0) {
    const r = Math.random() * 100;
    const bonus = Math.min(floorBonus * 0.3, 15); // bonus max 15%
    if (r < 2  + bonus * 0.5)  return 'legendary';
    if (r < 10 + bonus)        return 'epic';
    if (r < 35 + bonus * 1.5)  return 'rare';
    return 'common';
  }

  /** Génère un drop aléatoire pour un ennemi vaincu */
  function rollDrop(floor = 1) {
    if (Math.random() > 0.45) return null; // 45% de chance de drop

    const weaponKeys = Object.keys(WEAPONS);
    const armorKeys  = Object.keys(ARMORS);
    const pool       = [...weaponKeys, ...armorKeys];
    const baseId     = pool[Math.floor(Math.random() * pool.length)];
    const rarity     = rollRarity(floor);

    return createItem(baseId, rarity);
  }

  return { RARITY, WEAPONS, ARMORS, createItem, rollRarity, rollDrop };
})();