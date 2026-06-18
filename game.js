/* ═══════════════════════════════════════════════════════
   GAME.JS — Boucle principale, input, caméra, rendu
   + intégration CharacterCreator + auto-save
═══════════════════════════════════════════════════════ */

const Game = (() => {

  // ── ÉLÉMENTS DOM ────────────────────────────────────
  const canvas = document.getElementById('game-canvas');
  const ctx    = canvas.getContext('2d');

  const screens = {
    title   : document.getElementById('screen-title'),
    create  : document.getElementById('screen-create'),
    entry   : document.getElementById('screen-entry'),
    game    : document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover'),
    levelup : document.getElementById('screen-levelup'),
  };

  const hud = {
    hp      : document.getElementById('bar-hp'),
    xp      : document.getElementById('bar-xp'),
    txtHp   : document.getElementById('txt-hp'),
    txtXp   : document.getElementById('txt-xp'),
    txtFloor: document.getElementById('txt-floor'),
    txtLevel: document.getElementById('txt-level'),
    txtGold : document.getElementById('txt-gold'),
    name    : document.getElementById('hud-player-name'),
  };

  // ── ÉTAT DU JEU ─────────────────────────────────────
  let player   = null;
  let enemies  = [];
  let lastTime = 0;
  let rafId    = null;
  let running  = false;
  let floorCleared = false;
  let appearance   = null;   // données apparence personnage

  const cam = { x: 0, y: 0 };
  const WORLD_W = 1200;
  const WORLD_H = 900;

  // ── INPUT JOYSTICK ──────────────────────────────────
  const joystick = {
    active: false, touchId: null,
    baseX: 0, baseY: 0,
    knobX: 0, knobY: 0,
    dx: 0, dy: 0, maxR: 38,
  };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup',   e => { keys[e.key] = false; });

  // ────────────────────────────────────────────────────
  //  AFFICHAGE ÉCRANS
  // ────────────────────────────────────────────────────
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
  }

  // ────────────────────────────────────────────────────
  //  FLUX DE DÉMARRAGE
  // ────────────────────────────────────────────────────
  function startNewGame() {
    // Première fois : affiche le créateur de personnage
    CharacterCreator.show(document.getElementById('create-scroll'), (charData) => {
      // Sauvegarde l'apparence
      SaveManager.saveAppearance(charData);
      appearance = charData;
      // Remet une save fraîche avec le bon nom
      SaveManager.clear();
      const fresh = SaveManager.defaultSave();
      fresh.playerName = charData.name;
      SaveManager.save(fresh);
      // Lance le jeu
      initGame(fresh);
    });
    showScreen('create');
  }

  function continueGame() {
    appearance = SaveManager.loadAppearance();
    const saveData = SaveManager.load();
    initGame(saveData);
  }

  // ────────────────────────────────────────────────────
  //  INITIALISATION DU JEU
  // ────────────────────────────────────────────────────
  function initGame(saveData) {
    player = new Player(saveData);
    player.appearance = appearance;
    player.x = WORLD_W / 2;
    player.y = WORLD_H * 0.75;

    enemies = [];
    floorCleared = false;
    spawnFloor();

    // Auto-save toutes les 30s
    SaveManager.startAutoSave(() => player ? player.toSaveData() : null, 30000);
    // Sauvegarde si on quitte
    SaveManager.bindUnloadSave(() => player ? player.toSaveData() : null);

    showScreen('game');
    updateHUD();
    if (!running) startLoop();
  }

  function spawnFloor() {
    enemies = Enemy.spawnWave(player.floor, WORLD_W, WORLD_H, WORLD_W/2, WORLD_H/2);
    floorCleared = false;
    player.x = WORLD_W / 2;
    player.y = WORLD_H * 0.75;
  }

  // ────────────────────────────────────────────────────
  //  BOUCLE PRINCIPALE
  // ────────────────────────────────────────────────────
  function startLoop() {
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    update(dt);
    render();
    if (running) rafId = requestAnimationFrame(loop);
  }

  // ────────────────────────────────────────────────────
  //  UPDATE
  // ────────────────────────────────────────────────────
  function update(dt) {
    if (!player) return;

    let ix = joystick.dx;
    let iy = joystick.dy;
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) ix -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) ix += 1;
    if (keys['ArrowUp']    || keys['w'] || keys['W']) iy -= 1;
    if (keys['ArrowDown']  || keys['s'] || keys['S']) iy += 1;
    const len = Math.hypot(ix, iy);
    if (len > 1) { ix /= len; iy /= len; }

    player.update(dt, ix, iy);
    player.x = Math.max(player.radius, Math.min(WORLD_W - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(WORLD_H - player.radius, player.y));

    // Caméra
    const tcx = player.x - canvas.width  / 2;
    const tcy = player.y - canvas.height / 2;
    cam.x += (tcx - cam.x) * 8 * dt;
    cam.y += (tcy - cam.y) * 8 * dt;
    cam.x = Math.max(0, Math.min(WORLD_W - canvas.width,  cam.x));
    cam.y = Math.max(0, Math.min(WORLD_H - canvas.height, cam.y));

    enemies.forEach(e => e.update(dt, player));
    enemies = enemies.filter(e => !e.canRemove());

    if (player.hp <= 0) {
      SaveManager.save(player.toSaveData());
      SaveManager.stopAutoSave();
      showScreen('gameover');
      stopLoop();
      return;
    }

    const alive = enemies.filter(e => e.alive);
    if (!floorCleared && alive.length === 0 && enemies.length > 0) {
      floorCleared = true;
      setTimeout(nextFloor, 1500);
    }

    updateHUD();
  }

  function nextFloor() {
    player.floor += 1;
    player.hp = Math.min(player.hp + Math.round(player.effectiveMaxHp * 0.3), player.effectiveMaxHp);
    floatMsg(`🏆 Étage ${player.floor} !`, canvas.width/2, canvas.height/2, 'xp', 28);
    SaveManager.save(player.toSaveData());
    spawnFloor();
    updateHUD();
  }

  // ────────────────────────────────────────────────────
  //  COMBAT
  // ────────────────────────────────────────────────────
  function doAttack() {
    if (!player) return;
    const result = player.attack();
    if (!result) return;
    enemies.forEach(e => {
      if (!e.alive) return;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < result.range + e.radius) {
        const dmg = e.takeDamage(result.damage);
        floatMsg(result.crit ? `💥${dmg}` : `-${dmg}`, e.x, e.y - 20, result.crit ? 'crit' : 'dmg');
        if (!e.alive) onEnemyKilled(e);
      }
    });
  }

  function doSkill(index) {
    if (!player) return;
    const result = player.useSkill(index);
    if (!result) return;
    enemies.forEach(e => {
      if (!e.alive) return;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      const inRange = result.aoe ? dist < 130 + e.radius : dist < result.range + e.radius;
      if (inRange) {
        const dmg = e.takeDamage(result.damage);
        floatMsg(`⚡${dmg}`, e.x, e.y - 20, 'crit');
        if (!e.alive) onEnemyKilled(e);
      }
    });
    updateSkillButtons();
  }

  function onEnemyKilled(e) {
    const leveled = player.gainXp(e.xpReward);
    floatMsg(`+${e.xpReward} XP`, e.x, e.y - 35, 'xp');
    player.gold += e.goldReward;
    floatMsg(`+${e.goldReward}🪙`, e.x + 15, e.y - 20, 'gold');
    const drop = Inventory.rollDrop(player.floor);
    if (drop) {
      player.inventory.push(drop);
      floatMsg(`⬆ ${drop.rarityLabel} ${drop.name}`, e.x, e.y - 50, 'xp');
    }
    if (leveled.length > 0) leveled.forEach(lv => showLevelUp(lv));
    SaveManager.save(player.toSaveData());
  }

  // ────────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawFloor();
    enemies.forEach(e => e.draw(ctx, cam.x, cam.y));
    if (player) player.draw(ctx);
    ctx.restore();
  }

  function drawFloor() {
    const TILE = 64;
    const cols = Math.ceil(WORLD_W / TILE);
    const rows = Math.ceil(WORLD_H / TILE);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#0d1020' : '#0f1428';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
    }
    ctx.strokeStyle = '#1a3a6a';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, WORLD_W - 4, WORLD_H - 4);

    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#00cfff';
    ctx.lineWidth = 2;
    const cx = WORLD_W/2, cy = WORLD_H/2, r = 120;
    for (let i = 0; i < 6; i++) {
      const a = (i/6)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r*0.5, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // ────────────────────────────────────────────────────
  //  HUD
  // ────────────────────────────────────────────────────
  function updateHUD() {
    if (!player) return;
    const hpPct = Math.max(0, player.hp / player.effectiveMaxHp) * 100;
    const xpPct = (player.xp / player.xpToNext) * 100;
    hud.hp.style.width      = hpPct + '%';
    hud.xp.style.width      = xpPct + '%';
    hud.txtHp.textContent   = `${Math.ceil(player.hp)}/${player.effectiveMaxHp}`;
    hud.txtXp.textContent   = `${player.xp}/${player.xpToNext}`;
    hud.txtFloor.textContent= player.floor;
    hud.txtLevel.textContent= player.level;
    hud.txtGold.textContent = player.gold;
    if (player.playerName) hud.name.textContent = player.playerName;
    updateSkillButtons();
  }

  function updateSkillButtons() {
    if (!player) return;
    player.skills.forEach((sk, i) => {
      const btn = document.getElementById(`btn-skill${i+1}`);
      if (!btn) return;
      if (sk.timer > 0) {
        btn.classList.add('on-cd');
        btn.querySelector('.skill-cd').textContent = Math.ceil(sk.timer) + 's';
      } else {
        btn.classList.remove('on-cd');
        btn.querySelector('.skill-cd').textContent = '';
      }
    });
  }

  function floatMsg(text, worldX, worldY, type = 'dmg', size) {
    const el = document.createElement('div');
    el.className = `float-msg ${type}`;
    el.textContent = text;
    if (size) el.style.fontSize = size + 'px';
    const sx = worldX - cam.x + (Math.random()-0.5)*20;
    const sy = worldY - cam.y;
    el.style.left = sx + 'px';
    el.style.top  = sy + 'px';
    document.getElementById('float-messages').appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function showLevelUp(lv) {
    document.getElementById('levelup-num').textContent = `Niveau ${lv}`;
    document.getElementById('levelup-stats').innerHTML = `ATK +2 &nbsp; DEF +1 &nbsp; SPD +1 &nbsp; HP +15`;
    showScreen('levelup');
    stopLoop();
  }

  // ────────────────────────────────────────────────────
  //  JOYSTICK
  // ────────────────────────────────────────────────────
  function initJoystick() {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');

    function onStart(e) {
      e.preventDefault();
      const t = e.changedTouches ? e.changedTouches[0] : e;
      if (joystick.active) return;
      joystick.active = true;
      joystick.touchId = t.identifier ?? 0;
      const rect = base.getBoundingClientRect();
      joystick.baseX = rect.left + rect.width  / 2;
      joystick.baseY = rect.top  + rect.height / 2;
    }
    function onMove(e) {
      e.preventDefault();
      if (!joystick.active) return;
      const touches = e.changedTouches ? Array.from(e.changedTouches) : [e];
      const t = touches.find(t => t.identifier === joystick.touchId) ?? touches[0];
      if (!t) return;
      let dx = t.clientX - joystick.baseX;
      let dy = t.clientY - joystick.baseY;
      const dist = Math.hypot(dx, dy);
      if (dist > joystick.maxR) { dx = dx/dist*joystick.maxR; dy = dy/dist*joystick.maxR; }
      joystick.dx = dx / joystick.maxR;
      joystick.dy = dy / joystick.maxR;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
    function onEnd() {
      joystick.active = false; joystick.dx = 0; joystick.dy = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    }

    zone.addEventListener('touchstart',    onStart, { passive: false });
    window.addEventListener('touchmove',   onMove,  { passive: false });
    window.addEventListener('touchend',    onEnd);
    window.addEventListener('touchcancel', onEnd);
    zone.addEventListener('mousedown',     onStart);
    window.addEventListener('mousemove',   e => { if (joystick.active) onMove(e); });
    window.addEventListener('mouseup',     onEnd);
  }

  // ────────────────────────────────────────────────────
  //  RESIZE
  // ────────────────────────────────────────────────────
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ec = document.getElementById('entry-canvas');
    if (ec) { ec.width = window.innerWidth; ec.height = window.innerHeight; }
  }

  // ────────────────────────────────────────────────────
  //  BINDINGS BOUTONS
  // ────────────────────────────────────────────────────
  function bindButtons() {
    // Titre → Nouvelle partie
    document.getElementById('btn-start').addEventListener('click', () => {
      SaveManager.clearAll();
      startNewGame();
    });

    // Titre → Continuer
    const btnCont = document.getElementById('btn-continue');
    if (SaveManager.exists() && SaveManager.hasCharacter()) {
      btnCont.style.display = '';
    }
    btnCont.addEventListener('click', continueGame);

    // Attaque
    const btnAtk = document.getElementById('btn-attack');
    btnAtk.addEventListener('touchstart', e => { e.preventDefault(); doAttack(); }, { passive: false });
    btnAtk.addEventListener('mousedown',  doAttack);

    // Esquive
    const btnDodge = document.getElementById('btn-dodge');
    btnDodge.addEventListener('touchstart', e => { e.preventDefault(); if(player) player.dodge(); }, { passive: false });
    btnDodge.addEventListener('mousedown',  () => { if(player) player.dodge(); });

    // Compétences
    [1,2,3].forEach(i => {
      const btn = document.getElementById(`btn-skill${i}`);
      btn.addEventListener('touchstart', e => { e.preventDefault(); doSkill(i-1); }, { passive: false });
      btn.addEventListener('mousedown',  () => doSkill(i-1));
    });

    // Clavier
    window.addEventListener('keydown', e => {
      if (e.code === 'Space')     { e.preventDefault(); doAttack(); }
      if (e.code === 'ShiftLeft') { if(player) player.dodge(); }
      if (e.code === 'Digit1')    doSkill(0);
      if (e.code === 'Digit2')    doSkill(1);
      if (e.code === 'Digit3')    doSkill(2);
    });

    // Level up OK
    document.getElementById('btn-levelup-ok').addEventListener('click', () => {
      showScreen('game');
      if (!running) startLoop();
    });

    // Game over → retry
    document.getElementById('btn-retry').addEventListener('click', () => {
      const save = SaveManager.load();
      save.hp = save.maxHp;
      SaveManager.save(save);
      appearance = SaveManager.loadAppearance();
      initGame(save);
    });
  }

  // ────────────────────────────────────────────────────
  //  DÉMARRAGE
  // ────────────────────────────────────────────────────
  function start() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    bindButtons();
    initJoystick();
    showScreen('title');
  }

  return { start };
})();

// ── LANCEMENT ────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  Game.start();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../service-worker.js')
      .then(() => console.log('[PWA] SW enregistré'))
      .catch(err => console.warn('[PWA] SW erreur:', err));
  }
});