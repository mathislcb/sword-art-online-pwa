/* ═══════════════════════════════════════════════════════
   CHARACTER.JS — Création personnage + animation entrée
═══════════════════════════════════════════════════════ */

const CharacterCreator = (() => {

  // ── OPTIONS DISPONIBLES ──────────────────────────────

  const HAIR_STYLES = [
    { id: 0, name: 'Court',    draw: drawHairShort   },
    { id: 1, name: 'Long',     draw: drawHairLong    },
    { id: 2, name: 'Kirito',   draw: drawHairKirito  },
    { id: 3, name: 'Spike',    draw: drawHairSpike   },
  ];

  const HAIR_COLORS = [
    '#1a1a1a', '#4a2800', '#8B4513', '#c8a060',
    '#f5e0a0', '#dddddd', '#cc0000', '#2244cc',
    '#224422', '#882288',
  ];

  const SKIN_COLORS = [
    '#f5d5a0', '#e8b87a', '#c8845a', '#8a5230',
    '#5a2e10', '#fde8d0', '#ffe4c8',
  ];

  const EYE_COLORS = [
    '#2244aa', '#228844', '#883333', '#886622',
    '#441188', '#888888', '#00aacc', '#cc4488',
  ];

  const OUTFITS = [
    { id: 0, name: 'Manteau Noir',  icon: '🖤', bodyColor: '#1a1a2a', trimColor: '#2244aa' },
    { id: 1, name: 'Armure Bleue',  icon: '🔵', bodyColor: '#1a2a4a', trimColor: '#00aaff' },
    { id: 2, name: 'Cape Rouge',    icon: '🔴', bodyColor: '#2a0a0a', trimColor: '#cc2222' },
    { id: 3, name: 'Tenue Verte',   icon: '🟢', bodyColor: '#0a2a0a', trimColor: '#22aa44' },
    { id: 4, name: 'Or & Blanc',    icon: '⭐', bodyColor: '#2a2010', trimColor: '#ddaa00' },
  ];

  // ── ÉTAT COURANT ─────────────────────────────────────
  let current = {
    name      : '',
    hairStyle : 0,
    hairColor : '#1a1a1a',
    skinColor : '#f5d5a0',
    eyeColor  : '#2244aa',
    outfitId  : 0,
  };

  // ── CANVAS PREVIEW ───────────────────────────────────
  let previewCanvas, previewCtx;

  // ── DESSIN PREVIEW ───────────────────────────────────
  function drawPreview() {
    if (!previewCtx) return;
    const W = previewCanvas.width;
    const H = previewCanvas.height;
    const cx = W / 2, cy = H * 0.52;
    const scale = H / 220;
    previewCtx.clearRect(0, 0, W, H);

    // Fond
    const bg = previewCtx.createRadialGradient(cx, cy, 10, cx, cy, H * 0.55);
    bg.addColorStop(0, 'rgba(20,50,100,0.4)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    previewCtx.fillStyle = bg;
    previewCtx.fillRect(0, 0, W, H);

    // Ombre
    previewCtx.beginPath();
    previewCtx.ellipse(cx, cy + 58 * scale, 28 * scale, 8 * scale, 0, 0, Math.PI * 2);
    previewCtx.fillStyle = 'rgba(0,0,0,0.3)';
    previewCtx.fill();

    const outfit = OUTFITS[current.outfitId];

    previewCtx.save();
    previewCtx.translate(cx, cy);
    previewCtx.scale(scale, scale);

    // Corps / manteau
    previewCtx.beginPath();
    previewCtx.roundRect(-18, -10, 36, 55, 5);
    previewCtx.fillStyle = outfit.bodyColor;
    previewCtx.fill();
    previewCtx.strokeStyle = outfit.trimColor;
    previewCtx.lineWidth = 2;
    previewCtx.stroke();

    // Col / détails tenue
    previewCtx.beginPath();
    previewCtx.moveTo(-8, -10); previewCtx.lineTo(0, 5); previewCtx.lineTo(8, -10);
    previewCtx.strokeStyle = outfit.trimColor;
    previewCtx.lineWidth = 1.5;
    previewCtx.stroke();

    // Bras gauche
    previewCtx.beginPath();
    previewCtx.roundRect(-26, -8, 10, 36, 4);
    previewCtx.fillStyle = outfit.bodyColor;
    previewCtx.fill();
    previewCtx.strokeStyle = outfit.trimColor;
    previewCtx.lineWidth = 1.5;
    previewCtx.stroke();

    // Bras droit
    previewCtx.beginPath();
    previewCtx.roundRect(16, -8, 10, 36, 4);
    previewCtx.fillStyle = outfit.bodyColor;
    previewCtx.fill();
    previewCtx.strokeStyle = outfit.trimColor;
    previewCtx.lineWidth = 1.5;
    previewCtx.stroke();

    // Jambes
    previewCtx.fillStyle = '#0a0a1a';
    previewCtx.beginPath(); previewCtx.roundRect(-15, 44, 13, 28, 3); previewCtx.fill();
    previewCtx.beginPath(); previewCtx.roundRect(2,  44, 13, 28, 3); previewCtx.fill();

    // Cou
    previewCtx.beginPath();
    previewCtx.roundRect(-5, -20, 10, 14, 3);
    previewCtx.fillStyle = current.skinColor;
    previewCtx.fill();

    // Tête
    previewCtx.beginPath();
    previewCtx.ellipse(0, -42, 20, 22, 0, 0, Math.PI * 2);
    previewCtx.fillStyle = current.skinColor;
    previewCtx.fill();

    // Yeux
    previewCtx.fillStyle = current.eyeColor;
    previewCtx.beginPath(); previewCtx.ellipse(-7, -42, 4, 5, 0, 0, Math.PI * 2); previewCtx.fill();
    previewCtx.beginPath(); previewCtx.ellipse( 7, -42, 4, 5, 0, 0, Math.PI * 2); previewCtx.fill();
    previewCtx.fillStyle = '#000';
    previewCtx.beginPath(); previewCtx.arc(-7, -42, 2, 0, Math.PI * 2); previewCtx.fill();
    previewCtx.beginPath(); previewCtx.arc( 7, -42, 2, 0, Math.PI * 2); previewCtx.fill();
    previewCtx.fillStyle = 'rgba(255,255,255,0.8)';
    previewCtx.beginPath(); previewCtx.arc(-5.5, -43.5, 1.2, 0, Math.PI * 2); previewCtx.fill();
    previewCtx.beginPath(); previewCtx.arc( 8.5, -43.5, 1.2, 0, Math.PI * 2); previewCtx.fill();

    // Nez
    previewCtx.strokeStyle = 'rgba(0,0,0,0.3)';
    previewCtx.lineWidth = 1;
    previewCtx.beginPath(); previewCtx.arc(0, -36, 2, 0.2, Math.PI - 0.2); previewCtx.stroke();

    // Bouche
    previewCtx.beginPath();
    previewCtx.arc(0, -31, 5, 0.15, Math.PI - 0.15);
    previewCtx.strokeStyle = 'rgba(150,80,80,0.6)';
    previewCtx.lineWidth = 1.5;
    previewCtx.stroke();

    // Cheveux
    HAIR_STYLES[current.hairStyle].draw(previewCtx, current.hairColor);

    // Épée (dans le dos)
    previewCtx.save();
    previewCtx.translate(20, 5);
    previewCtx.rotate(0.25);
    previewCtx.beginPath();
    previewCtx.moveTo(0, -50); previewCtx.lineTo(0, 10);
    previewCtx.strokeStyle = '#aaddff';
    previewCtx.lineWidth = 3;
    previewCtx.lineCap = 'round';
    previewCtx.shadowColor = '#aaddff';
    previewCtx.shadowBlur = 6;
    previewCtx.stroke();
    previewCtx.beginPath();
    previewCtx.moveTo(-7, -30); previewCtx.lineTo(7, -30);
    previewCtx.strokeStyle = '#6a9aaa';
    previewCtx.lineWidth = 2.5;
    previewCtx.stroke();
    previewCtx.restore();

    previewCtx.restore();

    // Nom sous le perso
    if (current.name) {
      previewCtx.font = `bold ${Math.round(13 * scale)}px Orbitron, sans-serif`;
      previewCtx.fillStyle = '#00cfff';
      previewCtx.textAlign = 'center';
      previewCtx.shadowColor = '#00cfff';
      previewCtx.shadowBlur = 8;
      previewCtx.fillText(current.name, cx, cy + 80 * scale);
      previewCtx.shadowBlur = 0;
    }
  }

  // ── COUPES DE CHEVEUX ────────────────────────────────
  function drawHairShort(ctx, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -50, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-20, -55, 40, 15);
    ctx.beginPath();
    ctx.arc(-18, -44, 5, -Math.PI/2, Math.PI/2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18, -44, 5, -Math.PI/2, Math.PI/2, true);
    ctx.fill();
  }

  function drawHairLong(ctx, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -50, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-20, -55, 40, 15);
    ctx.beginPath();
    ctx.roundRect(-22, -55, 8, 55, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(14, -55, 8, 55, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-10, -55, 20, 40, 4);
    ctx.fill();
  }

  function drawHairKirito(ctx, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -50, 21, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-21, -58, 42, 18);
    ctx.beginPath();
    ctx.moveTo(-5, -65); ctx.lineTo(0, -80); ctx.lineTo(5, -65);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -63); ctx.lineTo(12, -75); ctx.lineTo(14, -60);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, -63); ctx.lineTo(-12, -75); ctx.lineTo(-14, -60);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-22, -56, 6, 30, 3);
    ctx.fill();
  }

  function drawHairSpike(ctx, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -50, 21, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-21, -60, 42, 15);
    const spikes = [[-14,-72],[-6,-80],[2,-76],[10,-82],[18,-70]];
    spikes.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(sx - 5, -60); ctx.lineTo(sx, sy); ctx.lineTo(sx + 5, -60);
      ctx.fill();
    });
  }

  // ── MINI PREVIEW POUR LES BOUTONS COUPE ─────────────
  function drawHairThumb(canvas, styleId, color) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h * 0.65);
    ctx.scale(0.7, 0.7);

    // Tête simple
    ctx.beginPath();
    ctx.ellipse(0, -20, 14, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f5d5a0'; ctx.fill();

    HAIR_STYLES[styleId].draw(ctx, color);
    ctx.restore();
  }

  // ── CONSTRUCTION DE L'UI ────────────────────────────
  function buildUI(container) {
    container.innerHTML = `
      <div class="create-header">
        <h2>⚔ CRÉATION DU PERSONNAGE</h2>
        <p>— Personnalisez votre avatar dans Aincrad —</p>
      </div>

      <div class="create-preview-wrap">
        <canvas id="create-canvas" width="160" height="220"></canvas>
      </div>

      <div class="create-name-wrap">
        <span class="create-label">NOM DU JOUEUR</span>
        <input id="input-name" type="text" maxlength="12"
               placeholder="Entrez votre nom..." autocomplete="off" />
      </div>

      <div class="create-section">
        <div class="section-title">COUPE DE CHEVEUX</div>
        <div class="hair-options" id="hair-style-opts"></div>
      </div>

      <div class="create-section">
        <div class="section-title">COULEUR DES CHEVEUX</div>
        <div class="color-palette" id="hair-color-opts"></div>
      </div>

      <div class="create-section">
        <div class="section-title">COULEUR DE PEAU</div>
        <div class="color-palette" id="skin-color-opts"></div>
      </div>

      <div class="create-section">
        <div class="section-title">COULEUR DES YEUX</div>
        <div class="color-palette" id="eye-color-opts"></div>
      </div>

      <div class="create-section">
        <div class="section-title">TENUE</div>
        <div class="outfit-options" id="outfit-opts"></div>
      </div>

      <div class="create-confirm-wrap">
        <button id="btn-create-confirm" class="btn-primary">
          ⚔ ENTRER DANS AINCRAD
        </button>
      </div>
    `;

    previewCanvas = document.getElementById('create-canvas');
    previewCtx    = previewCanvas.getContext('2d');

    // Input nom
    document.getElementById('input-name').addEventListener('input', e => {
      current.name = e.target.value;
      drawPreview();
    });

    // Coupes de cheveux
    const hairStyleContainer = document.getElementById('hair-style-opts');
    HAIR_STYLES.forEach(style => {
      const btn = document.createElement('div');
      btn.className = 'hair-opt' + (style.id === current.hairStyle ? ' selected' : '');
      const c = document.createElement('canvas');
      c.width = 44; c.height = 44;
      btn.appendChild(c);
      hairStyleContainer.appendChild(btn);
      drawHairThumb(c, style.id, current.hairColor);
      btn.addEventListener('click', () => {
        current.hairStyle = style.id;
        hairStyleContainer.querySelectorAll('.hair-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        // Refresh thumbs avec couleur actuelle
        hairStyleContainer.querySelectorAll('canvas').forEach((tc, i) => drawHairThumb(tc, i, current.hairColor));
        drawPreview();
      });
    });

    // Couleurs cheveux
    buildColorPalette('hair-color-opts', HAIR_COLORS, 'hairColor', () => {
      document.querySelectorAll('.hair-opt canvas').forEach((c, i) => drawHairThumb(c, i, current.hairColor));
    });

    // Couleur peau
    buildColorPalette('skin-color-opts', SKIN_COLORS, 'skinColor');

    // Couleur yeux
    buildColorPalette('eye-color-opts', EYE_COLORS, 'eyeColor');

    // Outfits
    const outfitContainer = document.getElementById('outfit-opts');
    OUTFITS.forEach(o => {
      const btn = document.createElement('div');
      btn.className = 'outfit-opt' + (o.id === current.outfitId ? ' selected' : '');
      btn.innerHTML = `<span class="outfit-icon">${o.icon}</span><span class="outfit-name">${o.name}</span>`;
      outfitContainer.appendChild(btn);
      btn.addEventListener('click', () => {
        current.outfitId = o.id;
        outfitContainer.querySelectorAll('.outfit-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        drawPreview();
      });
    });

    // Confirmer
    document.getElementById('btn-create-confirm').addEventListener('click', () => {
      const nameVal = document.getElementById('input-name').value.trim();
      if (!nameVal) {
        document.getElementById('input-name').focus();
        document.getElementById('input-name').style.borderColor = '#cc2222';
        setTimeout(() => document.getElementById('input-name').style.borderColor = '', 1000);
        return;
      }
      current.name = nameVal;
      startEntryAnimation(current);
    });

    drawPreview();
  }

  function buildColorPalette(containerId, colors, prop, extra) {
    const container = document.getElementById(containerId);
    colors.forEach(color => {
      const sw = document.createElement('div');
      sw.className = 'color-swatch' + (current[prop] === color ? ' selected' : '');
      sw.style.background = color;
      sw.style.border = `2.5px solid ${color === '#1a1a1a' ? '#444' : 'transparent'}`;
      container.appendChild(sw);
      sw.addEventListener('click', () => {
        current[prop] = color;
        container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        if (extra) extra();
        drawPreview();
      });
    });
  }

  // ════════════════════════════════════════════════════
  //  ANIMATION D'ENTRÉE DANS LE MONDE SAO
  // ════════════════════════════════════════════════════
  function startEntryAnimation(charData) {
    const screen = document.getElementById('screen-entry');
    const entryCanvas = document.getElementById('entry-canvas');
    const entryCtx = entryCanvas.getContext('2d');
    const textWrap = document.getElementById('entry-text-wrap');
    const flash    = document.getElementById('entry-flash');

    entryCanvas.width  = window.innerWidth;
    entryCanvas.height = window.innerHeight;

    // Affiche l'écran
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');

    // Particules flottantes (portail)
    const particles = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x    : Math.random() * entryCanvas.width,
        y    : Math.random() * entryCanvas.height,
        vx   : (Math.random() - 0.5) * 60,
        vy   : (Math.random() - 0.5) * 60,
        life : Math.random(),
        maxLife: 0.8 + Math.random() * 1.5,
        size : 1 + Math.random() * 3,
        color: Math.random() < 0.6 ? '#00cfff' : (Math.random() < 0.5 ? '#ffffff' : '#4488ff'),
      });
    }

    // Portail
    let portalRadius = 0;
    let portalAlpha  = 0;
    const targetRadius = Math.min(entryCanvas.width, entryCanvas.height) * 0.45;
    let phase = 'open'; // open → show → flash → done
    let elapsed = 0;
    let lastT = performance.now();
    let rafEntry;

    function loop(now) {
      const dt = (now - lastT) / 1000;
      lastT = now;
      elapsed += dt;

      const W = entryCanvas.width, H = entryCanvas.height;
      const cx = W / 2, cy = H / 2;

      entryCtx.clearRect(0, 0, W, H);

      // Fond étoilé
      entryCtx.fillStyle = '#000008';
      entryCtx.fillRect(0, 0, W, H);

      // Étoiles fixes
      if (!this._stars) {
        this._stars = Array.from({length: 80}, () => ({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.5, a: Math.random(),
        }));
      }
      this._stars.forEach(s => {
        entryCtx.globalAlpha = s.a * 0.6;
        entryCtx.beginPath();
        entryCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        entryCtx.fillStyle = '#fff';
        entryCtx.fill();
      });
      entryCtx.globalAlpha = 1;

      // Phase ouverture portail
      if (phase === 'open') {
        portalRadius = Math.min(targetRadius, portalRadius + targetRadius * dt * 1.2);
        portalAlpha  = Math.min(1, portalAlpha + dt * 1.5);
        if (portalRadius >= targetRadius * 0.98) {
          phase = 'show';
          elapsed = 0;
          textWrap.classList.add('visible');
        }
      }

      if (phase === 'show' && elapsed > 2.5) {
        phase = 'flash';
        elapsed = 0;
        flash.style.opacity = '1';
        setTimeout(() => {
          flash.style.opacity = '0';
          cancelAnimationFrame(rafEntry);
          // Lance le jeu
          if (window._onEntryDone) window._onEntryDone(charData);
        }, 400);
      }

      // Dessin portail
      drawPortal(entryCtx, cx, cy, portalRadius, elapsed, portalAlpha);

      // Particules
      particles.forEach(p => {
        p.life -= dt * 0.5;
        if (p.life <= 0) {
          p.x = cx + (Math.random() - 0.5) * portalRadius * 2;
          p.y = cy + (Math.random() - 0.5) * portalRadius * 2;
          p.life = p.maxLife;
          p.vx = (Math.random() - 0.5) * 80;
          p.vy = (Math.random() - 0.5) * 80;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const distC = Math.hypot(p.x - cx, p.y - cy);
        if (distC < portalRadius * 0.9) {
          entryCtx.globalAlpha = (p.life / p.maxLife) * 0.8;
          entryCtx.beginPath();
          entryCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          entryCtx.fillStyle = p.color;
          entryCtx.fill();
        }
      });
      entryCtx.globalAlpha = 1;

      if (phase !== 'flash') rafEntry = requestAnimationFrame(loop.bind(this));
    }

    rafEntry = requestAnimationFrame(loop.bind({}));
  }

  function drawPortal(ctx, cx, cy, radius, t, alpha) {
    if (radius <= 0) return;

    // Fond du portail (néant lumineux)
    const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.9);
    inner.addColorStop(0,   `rgba(30,80,200,${alpha * 0.5})`);
    inner.addColorStop(0.4, `rgba(10,30,100,${alpha * 0.4})`);
    inner.addColorStop(1,   `rgba(0,5,20,${alpha * 0.2})`);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = inner;
    ctx.fill();

    // Anneau extérieur tournant
    const rings = [
      { r: radius,       w: 4, speed: 0.4,  color: `rgba(0,207,255,${alpha})` },
      { r: radius * 0.9, w: 2, speed: -0.6, color: `rgba(100,180,255,${alpha * 0.7})` },
      { r: radius * 0.7, w: 1.5, speed: 0.9, color: `rgba(150,220,255,${alpha * 0.5})` },
    ];

    rings.forEach(ring => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * ring.speed);
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth   = ring.w;
      ctx.shadowColor = ring.color;
      ctx.shadowBlur  = 15;
      ctx.setLineDash([ring.r * 0.2, ring.r * 0.1]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Lueur centrale
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.5);
    glow.addColorStop(0,   `rgba(100,200,255,${alpha * 0.3})`);
    glow.addColorStop(0.5, `rgba(50,100,200,${alpha * 0.15})`);
    glow.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Traits de données (style SAO)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.2, Math.sin(a) * radius * 0.2);
      ctx.lineTo(Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85);
      ctx.strokeStyle = `rgba(0,207,255,${alpha * 0.15})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── API PUBLIQUE ─────────────────────────────────────
  function show(container, onDone) {
    window._onEntryDone = onDone;
    buildUI(container);
    drawPreview();
  }

  function getDefaults() {
    return { ...current };
  }

  return { show, getDefaults, OUTFITS, HAIR_STYLES };
})();