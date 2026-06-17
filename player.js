/* ═══════════════════════════════════════════════════════
   PLAYER.JS — Kirito / Joueur
═══════════════════════════════════════════════════════ */

class Player {
  constructor(saveData) {
    // ── Position & mouvement ─────────────────────────
    this.x       = 0;
    this.y       = 0;
    this.radius  = 18;
    this.speed   = 180; // px/s base
    this.vx      = 0;
    this.vy      = 0;
    this.angle   = 0;   // direction regardée

    // ── Stats de base ────────────────────────────────
    this.level   = saveData.level   ?? 1;
    this.xp      = saveData.xp      ?? 0;
    this.xpToNext= saveData.xpToNext?? 100;
    this.maxHp   = saveData.maxHp   ?? 100;
    this.hp      = saveData.hp      ?? this.maxHp;
    this.gold    = saveData.gold    ?? 0;
    this.floor   = saveData.floor   ?? 1;
    this.atk     = saveData.stats?.atk ?? 10;
    this.def     = saveData.stats?.def ?? 5;
    this.spd     = saveData.stats?.spd ?? 5;

    // ── Équipement ───────────────────────────────────
    this.equipped  = saveData.equipped  ?? { weapon: null, armor: null };
    this.inventory = saveData.inventory ?? [];

    // ── État ─────────────────────────────────────────
    this.isDodging    = false;
    this.dodgeTimer   = 0;
    this.dodgeCooldown= 0;
    this.dodgeDuration= 0.25; // secondes
    this.dodgeCoolMax = 1.0;
    this.invincible   = false;

    this.attackTimer  = 0;  // temps restant de l'animation d'attaque
    this.attackCooldown = 0;

    // ── Compétences ──────────────────────────────────
    this.skills = [
      { name: 'Sonic Leap',   icon: '⚡', cooldown: 4,  timer: 0, dmgMult: 1.8, range: 80  },
      { name: 'Spin Slash',   icon: '🌀', cooldown: 7,  timer: 0, dmgMult: 1.4, aoe: true   },
      { name: 'Burst Strike', icon: '💥', cooldown: 12, timer: 0, dmgMult: 2.5, range: 60  },
    ];

    // ── Visuel ───────────────────────────────────────
    this.color      = '#1a8aff';
    this.hairColor  = '#1a1a2a';
    this.swordColor = '#aaddff';
    this.glowColor  = 'rgba(26,138,255,0.4)';

    // ── Particules ───────────────────────────────────
    this.particles  = [];

    this._recalcStats();
  }

  // ── RECALCULE LES STATS AVEC L'ÉQUIPEMENT ─────────
  _recalcStats() {
    const w = this.equipped.weapon;
    const a = this.equipped.armor;

    this.effectiveAtk   = this.atk + (w?.damage  ?? 0);
    this.effectiveDef   = this.def + (a?.defense  ?? 0);
    this.effectiveMaxHp = this.maxHp + (a?.hpBonus ?? 0);
    this.attackRange    = (w?.range ?? 55);
    this.attackSpeed    = 1 / (0.4 / (w?.speed ?? 1.0)); // attackCoolMax en s
    this.attackCoolMax  = Math.max(0.2, 0.5 / (w?.speed ?? 1.0));
    this.speed          = 180 + this.spd * 4;
  }

  // ── GAIN D'EXPÉRIENCE ────────────────────────────
  gainXp(amount) {
    this.xp += amount;
    const leveled = [];
    while (this.xp >= this.xpToNext) {
      this.xp      -= this.xpToNext;
      this.level   += 1;
      this.xpToNext = Math.round(this.xpToNext * 1.25);
      this.atk     += 2;
      this.def     += 1;
      this.spd     += 1;
      this.maxHp   += 15;
      this.hp       = Math.min(this.hp + 30, this.effectiveMaxHp);
      this._recalcStats();
      leveled.push(this.level);
    }
    return leveled;
  }

  // ── PRENDRE DES DÉGÂTS ───────────────────────────
  takeDamage(amount) {
    if (this.invincible || this.isDodging) return 0;
    const dmg = Math.max(1, amount - this.effectiveDef);
    this.hp   = Math.max(0, this.hp - dmg);
    this.invincible = true;
    setTimeout(() => { this.invincible = false; }, 600);
    this._spawnHitParticles();
    return dmg;
  }

  // ── ATTAQUE ──────────────────────────────────────
  canAttack() { return this.attackCooldown <= 0; }

  attack() {
    if (!this.canAttack()) return null;
    this.attackCooldown = this.attackCoolMax;
    this.attackTimer    = 0.2;
    const dmg = Math.round(this.effectiveAtk * (0.85 + Math.random() * 0.3));
    const crit = Math.random() < 0.15;
    this._spawnAttackParticles();
    return { damage: crit ? dmg * 2 : dmg, crit, range: this.attackRange };
  }

  // ── COMPÉTENCE ───────────────────────────────────
  useSkill(index) {
    const sk = this.skills[index];
    if (!sk || sk.timer > 0) return null;
    sk.timer = sk.cooldown;
    const dmg = Math.round(this.effectiveAtk * sk.dmgMult);
    this._spawnSkillParticles(index);
    return { damage: dmg, aoe: sk.aoe ?? false, range: sk.range ?? this.attackRange };
  }

  // ── ESQUIVE ──────────────────────────────────────
  dodge() {
    if (this.dodgeCooldown > 0 || this.isDodging) return;
    this.isDodging    = true;
    this.dodgeTimer   = this.dodgeDuration;
    this.dodgeCooldown= this.dodgeCoolMax;
    // boost de vitesse pendant l'esquive
    const boost = 3.5;
    this.vx *= boost;
    this.vy *= boost;
    if (this.vx === 0 && this.vy === 0) {
      this.vx = Math.cos(this.angle) * this.speed * boost;
      this.vy = Math.sin(this.angle) * this.speed * boost;
    }
  }

  // ── MISE À JOUR ──────────────────────────────────
  update(dt, inputVx, inputVy) {
    // Direction
    if (inputVx !== 0 || inputVy !== 0) {
      this.angle = Math.atan2(inputVy, inputVx);
    }

    // Dodge
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.vx = inputVx * this.speed;
        this.vy = inputVy * this.speed;
      }
    } else {
      this.vx = inputVx * this.speed;
      this.vy = inputVy * this.speed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Timers
    if (this.attackCooldown > 0)  this.attackCooldown  -= dt;
    if (this.attackTimer > 0)     this.attackTimer     -= dt;
    if (this.dodgeCooldown > 0)   this.dodgeCooldown   -= dt;
    this.skills.forEach(sk => { if (sk.timer > 0) sk.timer -= dt; });

    // Particules de déplacement
    if (this.isDodging && Math.random() < 0.4) this._spawnDodgeParticle();

    // MAJ particules
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      return p.life > 0;
    });
  }

  // ── PARTICULES ───────────────────────────────────
  _spawnHitParticles() {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({ x: this.x, y: this.y, vx: Math.cos(a)*80, vy: Math.sin(a)*80, life: 0.5, color: '#ff4444', size: 3 });
    }
  }
  _spawnAttackParticles() {
    for (let i = 0; i < 5; i++) {
      const a = this.angle + (Math.random()-0.5)*0.8;
      this.particles.push({ x: this.x + Math.cos(this.angle)*20, y: this.y + Math.sin(this.angle)*20, vx: Math.cos(a)*120, vy: Math.sin(a)*120, life: 0.3, color: this.swordColor, size: 2 });
    }
  }
  _spawnSkillParticles(index) {
    const colors = ['#00cfff','#aa44ff','#ff6600'];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      this.particles.push({ x: this.x, y: this.y, vx: Math.cos(a)*150, vy: Math.sin(a)*150, life: 0.6, color: colors[index] ?? '#fff', size: 4 });
    }
  }
  _spawnDodgeParticle() {
    this.particles.push({ x: this.x + (Math.random()-0.5)*10, y: this.y + (Math.random()-0.5)*10, vx: -this.vx*0.2, vy: -this.vy*0.2, life: 0.4, color: 'rgba(100,180,255,0.6)', size: 5 });
  }

  // ── RENDU CANVAS ─────────────────────────────────
  draw(ctx) {
    ctx.save();

    // Particules
    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ombre au sol
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.6, this.radius * 0.7, this.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);

    // Aura d'invincibilité/esquive
    if (this.invincible || this.isDodging) {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = this.isDodging ? '#44ff88' : '#ff4444';
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Glow
    const grd = ctx.createRadialGradient(0, 0, this.radius * 0.3, 0, 0, this.radius * 1.6);
    grd.addColorStop(0, 'rgba(26,138,255,0.25)');
    grd.addColorStop(1, 'rgba(26,138,255,0)');
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Corps (manteau)
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a3a';
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Détail manteau
    ctx.beginPath();
    ctx.arc(0, 2, this.radius * 0.55, 0.3, Math.PI - 0.3);
    ctx.strokeStyle = '#2a3a6a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tête
    ctx.beginPath();
    ctx.arc(0, -this.radius * 0.35, this.radius * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = '#f5d5a0';
    ctx.fill();

    // Cheveux
    ctx.beginPath();
    ctx.arc(0, -this.radius * 0.42, this.radius * 0.38, Math.PI, Math.PI * 2);
    ctx.fillStyle = this.hairColor;
    ctx.fill();

    // Épée
    if (this.attackTimer > 0) {
      ctx.save();
      ctx.rotate(-0.5 + this.attackTimer * 3);
      ctx.beginPath();
      ctx.moveTo(8, -10);
      ctx.lineTo(12, -this.radius - 22);
      ctx.strokeStyle = this.swordColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowColor = this.swordColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.moveTo(10, -5);
      ctx.lineTo(13, -this.radius - 16);
      ctx.strokeStyle = '#7aaabb';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── SÉRIALISATION ─────────────────────────────────
  toSaveData() {
    return {
      level     : this.level,
      xp        : this.xp,
      xpToNext  : this.xpToNext,
      hp        : this.hp,
      maxHp     : this.maxHp,
      gold      : this.gold,
      floor     : this.floor,
      stats     : { atk: this.atk, def: this.def, spd: this.spd },
      inventory : this.inventory,
      equipped  : this.equipped,
    };
  }
}