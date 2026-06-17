/* ═══════════════════════════════════════════════════════
   SAVE.JS — Sauvegarde / Chargement via localStorage
   • Sauvegarde auto au lancement, toutes les 30s, à chaque event
   • Stocke l'apparence du personnage
═══════════════════════════════════════════════════════ */

const SaveManager = (() => {
  const KEY      = 'sao_save_v1';
  const KEY_CHAR = 'sao_char_v1';   // Apparence séparée

  // ── DONNÉES PAR DÉFAUT ───────────────────────────────
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

  const defaultAppearance = () => ({
    name      : 'Kirito',
    hairStyle : 2,
    hairColor : '#1a1a1a',
    skinColor : '#f5d5a0',
    eyeColor  : '#2244aa',
    outfitId  : 0,
  });

  // ── VÉRIFIE SI UNE PARTIE EXISTE ────────────────────
  function exists() {
    return !!localStorage.getItem(KEY);
  }

  // ── VÉRIFIE SI UN PERSONNAGE A ÉTÉ CRÉÉ ─────────────
  function hasCharacter() {
    return !!localStorage.getItem(KEY_CHAR);
  }

  // ── SAUVEGARDE PROGRESSION ──────────────────────────
  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
      return true;
    } catch (e) {
      console.warn('[Save] Erreur:', e);
      return false;
    }
  }

  // ── CHARGE PROGRESSION ──────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      return { ...defaultSave(), ...JSON.parse(raw) };
    } catch (e) {
      console.warn('[Save] Lecture échouée, reset:', e);
      return defaultSave();
    }
  }

  // ── SAUVEGARDE APPARENCE ────────────────────────────
  function saveAppearance(charData) {
    try {
      localStorage.setItem(KEY_CHAR, JSON.stringify(charData));
      return true;
    } catch (e) { return false; }
  }

  // ── CHARGE APPARENCE ────────────────────────────────
  function loadAppearance() {
    try {
      const raw = localStorage.getItem(KEY_CHAR);
      if (!raw) return defaultAppearance();
      return { ...defaultAppearance(), ...JSON.parse(raw) };
    } catch (e) { return defaultAppearance(); }
  }

  // ── EFFACE TOUT ─────────────────────────────────────
  function clear() {
    localStorage.removeItem(KEY);
    // NB: on garde l'apparence volontairement
  }

  function clearAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_CHAR);
  }

  // ── AUTO-SAVE PÉRIODIQUE (toutes les 30s) ───────────
  let _autoSaveCallback = null;
  let _autoSaveInterval = null;

  function startAutoSave(getDataFn, intervalMs = 30000) {
    _autoSaveCallback = getDataFn;
    if (_autoSaveInterval) clearInterval(_autoSaveInterval);
    _autoSaveInterval = setInterval(() => {
      if (_autoSaveCallback) {
        const data = _autoSaveCallback();
        if (data) {
          save(data);
          console.log('[Save] Auto-save ✓', new Date().toLocaleTimeString());
        }
      }
    }, intervalMs);
  }

  function stopAutoSave() {
    if (_autoSaveInterval) {
      clearInterval(_autoSaveInterval);
      _autoSaveInterval = null;
    }
  }

  // ── SAUVEGARDE À LA FERMETURE DE L'ONGLET ───────────
  function bindUnloadSave(getDataFn) {
    window.addEventListener('beforeunload', () => {
      const data = getDataFn();
      if (data) save(data);
    });
    // Aussi sur visibilitychange (appli mobile mise en arrière-plan)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        const data = getDataFn();
        if (data) save(data);
      }
    });
  }

  return {
    exists, hasCharacter,
    save, load,
    saveAppearance, loadAppearance,
    clear, clearAll,
    startAutoSave, stopAutoSave,
    bindUnloadSave,
    defaultSave, defaultAppearance,
  };
})();