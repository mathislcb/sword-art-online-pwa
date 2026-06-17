/* ═══════════════════════════════════════════════════════
   ENEMY.JS — Slime, Loup, Boss Minotaure
═══════════════════════════════════════════════════════ */

class Enemy {
  constructor(type, x, y, floor = 1) {
    this.type   = type;
    this.x      = x;
    this.y      = y;
    this.alive  = true;
    this.particles = [];

    const def = Enemy.TYPES[type];
    const scale = 1 + (floor - 1) * 0.08; // ennemis plus forts par étage

    this.name    = def.name;
    this.radius  = def.radius;
    this.maxHp   = Math.round(def.hp   * scale);
    this.hp      = this.maxHp;
    this.atk     = Math.round(def.atk  * scale);
    this.speed   = def.speed;
    this.xpReward  = Math.round(def.xp   * scale);
    this.goldReward= Math.round(def.gold * scale);
    this.color   = def.color;
    this.isBoss  = def.isBoss ?? false;

    // IA
    this.state       = 'idle';   // idle | chase | attack | hurt | dead
    this.stateTimer  = 0;
    this.attackTimer = 0;
    this.attackCooldown = def.attackCooldown ?? 1.5;
    this.detectionRange = def.detectionRange ?? 200;
    this.attackRange    = def.attackRange    ?? 45;
    this.angle = 0;

    // Animation
    this.animFrame  = 0;
    this.animTimer  = 0;
    this.hurtTimer  = 0;
    this.deathTimer = 0;
  }

  // ── DÉFINITIONS DES TYPES ────────────────────────
  static TYPES = {
    slime: {
      name: 'Slime', radius: 16, hp: 40, atk: 6, speed: 55,
      xp: 15, gold: 5, color: '#44cc44',
      attackCooldown: 1.8, detectionRange: 160, attackRange: 38,
    },
    wolf: {
      name: 'Loup Sauvage', radius: 20, hp: 75, atk: 12, speed: 95,
      xp: 30, gold: 12, color: '#888888',
      attackCooldown: 1.2, detectionRange: 240, attackRange: 44,
    },
    minotaur: {
      name: 'Boss Minotaure', radius: 34, hp: 600, atk: 28, speed: 65,
      xp: 250, gold: 100, color: '#8a3300', isBoss: true,
      attackCooldown: 0.9, detectionRange: 300, attackRange: 65,
    },
  };

  // ── FACTORY : génère les ennemis d'un étage ──────
  static spawnWave(floor, canvasW, canvasH, playerX, playerY) {
    const enemies = [];
    const isBossFloor = floor % 10 === 0;
    const count = isBossFloor ? 0 : Math.min(2 + Math.floor(floor / 3), 8);
    const types  = floor < 5 ? ['slime'] : ['slime','wolf'];

    if (isBossFloor) {
      enemies.push(new Enemy('minotaur',
        canvasW / 2 + (Math.random()-0.5)*80,
        canvasH * 0.3,
        floor));
    } else {
      for (let i = 0; i < count; i++) {
        let ex, ey, dist;
        let tries = 0;
        do {
          ex = 80 + Math.random() * (canvasW - 160);
          ey = 80 + Math.random() * (canvasH - 160);
          dist = Math.hypot(ex - playerX, ey - playerY);
          tries++;
        } while (dist < 160 && tries < 20);

        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push(new Enemy(type, ex, ey, floor));
      }
    }
    return enemies;
  }

  // ── PRENDRE DES DÉGÂTS ───────────────────────────
  takeDamage(amount) {
    if (!this.alive) return 0;
    const dmg = Math.max(1, amount);
    this.hp   = Math.max(0, this.hp - dmg);
    this.hurtTimer = 0.15;
    this._spawnHitParticles();
    if (this.hp <= 0) this._die();
    return dmg;
  }

  _die() {
    this.alive      = false;
    this.state      = 'dead';
    this.deathTimer = 0.6;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 100;
      this.particles.push({ x: this.x, y: this.y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, life: 0.8, color: this.color, size: 3 + Math.random()*4 });
    }
  }

  _spawnHitParticles() {
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({ x: this.x, y: this.y, vx: Math.cos(a)*70, vy: Math.sin(a)*70, life: 0.35, color: '#ffddaa', size: 3 });
    }
  }

  // ── MISE À JOUR ──────────────────────────────────
  update(dt, player) {
    // Particules
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.88;     p.vy *= 0.88;
      return p.life > 0;
    });

    if (!this.alive) {
      if (this.deathTimer > 0) this.deathTimer -= dt;
      return;
    }

    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;

    const dx   = player.x - this.x;
    const dy   = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    // Animation bounce (slime)
    this.animTimer += dt;
    if (this.animTimer > 0.3) { this.animFrame = (this.animFrame + 1) % 2; this.animTimer = 0; }

    // IA simple : idle → chase → attack
    if (dist < this.detectionRange) {
      if (dist < this.attackRange) {
        this.state = 'attack';
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCooldown;
          player.takeDamage(this.atk);
        }
      } else {
        this.state = 'chase';
        const norm = dist > 0 ? 1 / dist : 0;
        this.x += dx * norm * this.speed * dt;
        this.y += dy * norm * this.speed * dt;
      }
    } else {
      this.state = 'idle';
      // Légère errance
      if (Math.random() < 0.005) {
        const wanderA = Math.random() * Math.PI * 2;
        this.x += Math.cos(wanderA) * 20;
        this.y += Math.sin(wanderA) * 20;
      }
    }
  }

  // ── RENDU ────────────────────────────────────────
  draw(ctx, camX, camY) {
    // Particules
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life * 1.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });

    if (!this.alive && this.deathTimer <= 0) return;

    ctx.save();
    if (!this.alive) ctx.globalAlpha = this.deathTimer;

    const bounce = (this.type === 'slime' && this.animFrame === 1) ? 2 : 0;

    // Ombre
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.7 + bounce, this.radius * 0.6, this.radius * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // Flash si touché
    if (this.hurtTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y - bounce, this.radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    }

    // Corps selon le type
    switch (this.type) {
      case 'slime':  this._drawSlime(ctx, bounce);     break;
      case 'wolf':   this._drawWolf(ctx);               break;
      case 'minotaur': this._drawMinotaur(ctx);         break;
    }

    // Barre de vie
    this._drawHpBar(ctx);

    // Nom (boss)
    if (this.isBoss) {
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.fillStyle = '#ff6600';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur  = 8;
      ctx.fillText(this.name, this.x, this.y - this.radius - 18);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  _drawSlime(ctx, bounce) {
    // Corps
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - bounce, this.radius, this.radius * (0.85 + bounce * 0.05), 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#88ff88';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Yeux
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(this.x - 5, this.y - this.radius * 0.3 - bounce, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x + 5, this.y - this.radius * 0.3 - bounce, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(this.x - 4, this.y - this.radius * 0.35 - bounce, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x + 6, this.y - this.radius * 0.35 - bounce, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  _drawWolf(ctx) {
    // Corps principal
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);

    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 0.65, this.radius, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#666666';
    ctx.shadowColor = '#888';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tête
    ctx.beginPath();
    ctx.arc(0, -this.radius * 0.6, this.radius * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#555555';
    ctx.fill();

    // Oreilles
    ctx.beginPath();
    ctx.moveTo(-8, -this.radius * 0.85);
    ctx.lineTo(-12, -this.radius * 1.15);
    ctx.lineTo(-4,  -this.radius * 0.95);
    ctx.fillStyle = '#444';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -this.radius * 0.85);
    ctx.lineTo(12, -this.radius * 1.15);
    ctx.lineTo(4,  -this.radius * 0.95);
    ctx.fill();

    // Yeux rouges
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(-5, -this.radius * 0.65, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5, -this.radius * 0.65, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  _drawMinotaur(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Glow boss
    const grd = ctx.createRadialGradient(0, 0, this.radius, 0, 0, this.radius * 2);
    grd.addColorStop(0, 'rgba(180,60,0,0.3)');
    grd.addColorStop(1, 'rgba(180,60,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Corps
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#5a2200';
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur  = 18;
    ctx.fill();
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cornes
    ctx.strokeStyle = '#cc8800';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12, -this.radius * 0.7); ctx.lineTo(-22, -this.radius * 1.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 12, -this.radius * 0.7); ctx.lineTo( 22, -this.radius * 1.2); ctx.stroke();

    // Tête
    ctx.beginPath();
    ctx.arc(0, -this.radius * 0.4, this.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#6a2a00';
    ctx.fill();

    // Yeux
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(-7, -this.radius * 0.45, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 7, -this.radius * 0.45, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Hache
    ctx.save();
    ctx.rotate(this.animFrame === 1 ? 0.2 : -0.1);
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.5, 0);
    ctx.lineTo(this.radius * 1.2, -10);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.radius * 1.2, -10, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#aaaaaa';
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  _drawHpBar(ctx) {
    const bw  = this.isBoss ? this.radius * 3 : this.radius * 2;
    const bh  = this.isBoss ? 6 : 4;
    const bx  = this.x - bw / 2;
    const by  = this.y - this.radius - (this.isBoss ? 12 : 8);
    const pct = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

    ctx.fillStyle = '#300';
    ctx.fillRect(bx, by, bw, bh);

    const col = pct > 0.5 ? '#44cc44' : pct > 0.25 ? '#ccaa00' : '#cc2222';
    ctx.fillStyle = col;
    ctx.fillRect(bx, by, bw * pct, bh);
  }

  // Retourne vrai si l'ennemi est prêt à être supprimé
  canRemove() {
    return !this.alive && this.deathTimer <= 0 && this.particles.length === 0;
  }
}