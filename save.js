/* ═══════════════════════════════════════════════════════
   SAVE.JS — Sauvegarde / Chargement via localStorage
═══════════════════════════════════════════════════════ */

const SaveManager = (() => {
  const KEY = 'sao_save_v1';

  /** Données par défaut */
  const defaultSave = () => ({
    playerName : 'Kirito',
    level      : 1,
    xp         : 0,
    xpToNext   : 100,
    hp         : 100,
    maxHp      : 100,
    gold       : 0,
    floor      : 1,
    stats      : { atk: 10, def: 5, spd: 5 },
    inventory  : [],
    equipped   : { weapon: null, armor: null },
    timestamp  : Date.now(),
  });

  /** Vérifie si une sauvegarde existe */
  function exists() {
    return !!localStorage.getItem(KEY);
  }

  /** Sauvegarde les données */
  function save(data) {
    try {
      const payload = { ...data, timestamp: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn('[Save] Erreur lors de la sauvegarde:', e);
      return false;
    }
  }

  /** Charge les données (retourne un défaut si absent) */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      return { ...defaultSave(), ...JSON.parse(raw) };
    } catch (e) {
      console.warn('[Save] Erreur de lecture, réinitialisation:', e);
      return defaultSave();
    }
  }

  /** Efface la sauvegarde */
  function clear() {
    localStorage.removeItem(KEY);
  }

  return { exists, save, load, clear, defaultSave };
})();