// HTML5 Canvas 60FPS Space Arcade Game Engine - "Chiến Cơ Sa Hoàng"
import { sound } from "../audio";

export class GameEngine {
  constructor(canvas, fighter, onUpdateStats, onGameOver, onTideCloakNukeRequest) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.fighter = fighter;
    this.onUpdateStats = onUpdateStats;
    this.onGameOver = onGameOver;
    this.onTideCloakNukeRequest = onTideCloakNukeRequest;

    this.width = canvas.width = 900;
    this.height = canvas.height = 700;

    this.running = false;
    this.score = 0;
    this.combo = 0;
    this.wave = 1;
    this.shakeTime = 0;

    // Player State
    this.player = {
      x: this.width / 2,
      y: this.height - 100,
      width: 44,
      height: 48,
      hp: fighter.maxHp,
      maxHp: fighter.maxHp,
      shield: false,
      shieldDuration: 0,
      stealth: false,
      stealthDuration: 0,
      timeSlow: false,
      timeSlowDuration: 0,
      laserBeam: false,
      laserBeamDuration: 0,
      cooldowns: { Q: 0, W: 0, E: 0, R: 0 },
      lastShotTime: 0
    };

    this.keys = {};
    this.stars = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.particles = [];
    this.popups = [];
    this.boss = null;
    this.spawnTimer = 0;

    this.initStars();
    this.bindEvents();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 3 + 0.5,
        color: Math.random() > 0.5 ? "#FFF" : "#7986CB"
      });
    }
  }

  bindEvents() {
    this.keydownHandler = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (["q", "w", "e", "r"].includes(e.key.toLowerCase())) {
        this.castSkill(e.key.toUpperCase());
      }
    };
    this.keyupHandler = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", this.keydownHandler);
    window.addEventListener("keyup", this.keyupHandler);
  }

  destroy() {
    this.running = false;
    window.removeEventListener("keydown", this.keydownHandler);
    window.removeEventListener("keyup", this.keyupHandler);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  castSkill(key) {
    const skill = this.fighter.skills.find((s) => s.key === key);
    if (!skill || this.player.cooldowns[key] > 0) return;

    if (key === "R" && skill.requiresTideCloak) {
      if (this.onTideCloakNukeRequest) {
        this.onTideCloakNukeRequest(() => this.triggerTsarBomba(skill));
        return;
      }
    }

    this.executeSkillEffect(skill);
  }

  triggerTsarBomba(skill) {
    this.executeSkillEffect(skill);
  }

  executeSkillEffect(skill) {
    this.player.cooldowns[skill.key] = skill.cooldown;
    sound.playSkill(skill.key === "R" ? "bomb" : skill.type);

    this.addPopup(this.player.x, this.player.y - 40, `SKILL [${skill.key}]: ${skill.name}!`, this.fighter.color);
    this.shake(skill.key === "R" ? 25 : 10);

    // Effects implementation
    if (skill.type === "shield" || skill.type === "ice_wall") {
      this.player.shield = true;
      this.player.shieldDuration = skill.duration || 4;
    } else if (skill.type === "stealth") {
      this.player.stealth = true;
      this.player.stealthDuration = skill.duration || 3.5;
    } else if (skill.type === "time_slow") {
      this.player.timeSlow = true;
      this.player.timeSlowDuration = skill.duration || 5;
    } else if (skill.type === "laser_beam") {
      this.player.laserBeam = true;
      this.player.laserBeamDuration = skill.duration || 3;
    } else if (skill.type === "screen_nuke" || skill.type === "lightning_storm" || skill.type === "supernova" || skill.type === "blizzard_meteor" || skill.type === "event_horizon" || skill.type === "multi_slash") {
      // Tsar Ultimate!
      this.createShockwave(this.width / 2, this.height / 2, 800, this.fighter.color);
      this.enemies.forEach((enemy) => {
        enemy.hp -= 5000;
        this.addPopup(enemy.x, enemy.y, "-5000 CRIT!", "#FF1744");
      });
      this.enemyBullets = [];
      if (this.boss) {
        this.boss.hp -= 5000;
        this.addPopup(this.boss.x, this.boss.y, "-5000 TSAR BOMBA!", "#FFD700");
      }
      if (skill.type === "supernova") {
        this.player.hp = this.player.maxHp;
        this.addPopup(this.player.x, this.player.y, "MAX REPAIR!", "#00E676");
      }
    } else if (skill.type === "emp" || skill.type === "freeze_all") {
      this.enemyBullets = [];
      this.enemies.forEach((e) => {
        e.frozen = true;
        e.freezeTime = 3.5;
        this.addPopup(e.x, e.y, "STUNNED!", "#00E5FF");
      });
      this.createShockwave(this.player.x, this.player.y, 400, "#00E5FF");
    } else if (skill.type === "barrage" || skill.type === "homing_swarm") {
      for (let a = -Math.PI / 3; a <= Math.PI / 3; a += Math.PI / 18) {
        this.bullets.push({
          x: this.player.x,
          y: this.player.y - 20,
          vx: Math.sin(a) * 12,
          vy: -Math.cos(a) * 12,
          damage: this.fighter.bullet.damage * 1.5,
          color: this.fighter.color,
          size: 6
        });
      }
    } else if (skill.type === "black_hole") {
      this.createShockwave(this.width / 2, 250, 300, "#9C27B0");
      this.enemies.forEach((e) => {
        e.x = (e.x + this.width / 2) / 2;
        e.y = (e.y + 250) / 2;
        e.hp -= 250;
      });
    } else if (skill.type === "time_rewind") {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.5);
      this.addPopup(this.player.x, this.player.y, "+50% HP REWIND!", "#00E676");
    }
  }

  shake(amount) {
    this.shakeTime = amount;
  }

  createShockwave(x, y, maxR, color) {
    this.particles.push({
      type: "shockwave",
      x,
      y,
      r: 10,
      maxR,
      color,
      alpha: 1
    });
  }

  addPopup(x, y, text, color) {
    this.popups.push({ x, y, text, color, alpha: 1, vy: -1.5 });
  }

  loop(currentTime) {
    if (!this.running) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    // Cooldown timers
    for (let k in this.player.cooldowns) {
      if (this.player.cooldowns[k] > 0) {
        this.player.cooldowns[k] = Math.max(0, this.player.cooldowns[k] - dt);
      }
    }

    // Active buffs
    if (this.player.shield) {
      this.player.shieldDuration -= dt;
      if (this.player.shieldDuration <= 0) this.player.shield = false;
    }
    if (this.player.stealth) {
      this.player.stealthDuration -= dt;
      if (this.player.stealthDuration <= 0) this.player.stealth = false;
    }
    if (this.player.timeSlow) {
      this.player.timeSlowDuration -= dt;
      if (this.player.timeSlowDuration <= 0) this.player.timeSlow = false;
    }
    if (this.player.laserBeam) {
      this.player.laserBeamDuration -= dt;
      if (this.player.laserBeamDuration <= 0) this.player.laserBeam = false;
      // Laser damage tick
      this.enemies.forEach((e) => {
        if (Math.abs(e.x - this.player.x) < 40 && e.y < this.player.y) {
          e.hp -= 200 * dt;
          this.addPopup(e.x, e.y, "-20", "#FFF");
        }
      });
      if (this.boss && Math.abs(this.boss.x - this.player.x) < 70 && this.boss.y < this.player.y) {
        this.boss.hp -= 300 * dt;
      }
    }

    // Player Movement
    let speed = this.fighter.speed * (this.player.stealth ? 1.5 : 1);
    if (this.keys["arrowleft"] || this.keys["a"]) this.player.x -= speed;
    if (this.keys["arrowright"] || this.keys["d"]) this.player.x += speed;
    if (this.keys["arrowup"] || this.keys["w"] && !this.keys["q"]) this.player.y -= speed;
    if (this.keys["arrowdown"] || this.keys["s"]) this.player.y += speed;

    this.player.x = Math.max(25, Math.min(this.width - 25, this.player.x));
    this.player.y = Math.max(40, Math.min(this.height - 30, this.player.y));

    // Player Auto-Shooting
    const now = performance.now();
    if (now - this.player.lastShotTime > this.fighter.bullet.fireRate) {
      this.shoot();
      this.player.lastShotTime = now;
    }

    // Stars
    this.stars.forEach((s) => {
      s.y += s.speed;
      if (s.y > this.height) s.y = 0;
    });

    // Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx || 0;
      b.y += b.vy !== undefined ? b.vy : -b.speed;
      if (b.y < -20 || b.y > this.height + 20 || b.x < -20 || b.x > this.width + 20) {
        this.bullets.splice(i, 1);
      }
    }

    // Enemy Bullets
    const enemySpeedFactor = this.player.timeSlow ? 0.2 : 1;
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += (eb.vx || 0) * enemySpeedFactor;
      eb.y += (eb.vy || 4) * enemySpeedFactor;

      // Player Collision
      if (!this.player.stealth) {
        const dist = Math.hypot(eb.x - this.player.x, eb.y - this.player.y);
        if (dist < 20) {
          if (this.player.shield) {
            // Reflect bullet!
            this.bullets.push({ x: eb.x, y: eb.y, vx: -eb.vx || 0, vy: -12, damage: 50, color: "#FFD700", size: 6 });
          } else {
            this.player.hp -= eb.damage || 25;
            this.shake(8);
            sound.playExplosion(false);
            this.addPopup(this.player.x, this.player.y, `-${eb.damage || 25}`, "#FF5252");
            if (this.player.hp <= 0) {
              this.gameOver();
              return;
            }
          }
          this.enemyBullets.splice(i, 1);
          continue;
        }
      }

      if (eb.y > this.height + 20) this.enemyBullets.splice(i, 1);
    }

    // Spawning Enemies
    this.spawnTimer += dt;
    if (this.spawnTimer > 1.2 && !this.boss) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Check Boss Spawn
    if (this.score >= 1200 && !this.boss && this.wave === 1) {
      this.spawnBoss();
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.frozen) {
        e.freezeTime -= dt;
        if (e.freezeTime <= 0) e.frozen = false;
      } else {
        e.y += e.vy * (this.player.timeSlow ? 0.2 : 1);
        e.x += Math.sin(e.y * 0.05 + e.seed) * 2;
        e.shootTimer += dt;
        if (e.shootTimer > e.shootInterval) {
          this.enemyBullets.push({ x: e.x, y: e.y + 15, vx: 0, vy: 5, damage: 20 });
          e.shootTimer = 0;
        }
      }

      // Check Bullet Collisions
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.size) {
          e.hp -= b.damage;
          this.addPopup(e.x, e.y - 10, `-${Math.round(b.damage)}`, b.color);
          this.createSpark(b.x, b.y, b.color);
          this.bullets.splice(j, 1);
          if (e.hp <= 0) break;
        }
      }

      // Enemy Died
      if (e.hp <= 0) {
        sound.playExplosion(false);
        this.createExplosion(e.x, e.y, e.color);
        this.score += e.points;
        this.combo++;
        this.enemies.splice(i, 1);
        continue;
      }

      // Ramming Player
      if (!this.player.stealth && Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.radius + 15) {
        if (!this.player.shield) {
          this.player.hp -= 40;
          this.shake(12);
          if (this.player.hp <= 0) {
            this.gameOver();
            return;
          }
        }
        e.hp = 0;
      }

      if (e.y > this.height + 50) this.enemies.splice(i, 1);
    }

    // Update Boss
    if (this.boss) {
      this.updateBoss(dt);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === "shockwave") {
        p.r += 600 * dt;
        p.alpha = 1 - p.r / p.maxR;
        if (p.r >= p.maxR) this.particles.splice(i, 1);
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= dt * 2;
        if (p.alpha <= 0) this.particles.splice(i, 1);
      }
    }

    // Popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y += pop.vy;
      pop.alpha -= dt * 1.2;
      if (pop.alpha <= 0) this.popups.splice(i, 1);
    }

    if (this.shakeTime > 0) this.shakeTime -= dt * 30;

    // Report stats
    if (this.onUpdateStats) {
      this.onUpdateStats({
        hp: Math.max(0, Math.round(this.player.hp)),
        maxHp: this.player.maxHp,
        score: this.score,
        wave: this.wave,
        cooldowns: this.player.cooldowns,
        bossHp: this.boss ? Math.round(this.boss.hp) : null,
        bossMaxHp: this.boss ? this.boss.maxHp : null
      });
    }
  }

  shoot() {
    sound.playLaser(this.fighter.bullet.damage > 40 ? 400 : 700);
    const b = this.fighter.bullet;
    if (b.type === "missile") {
      this.bullets.push({ x: this.player.x - 18, y: this.player.y - 10, speed: b.speed, damage: b.damage, color: b.color, size: b.size });
      this.bullets.push({ x: this.player.x + 18, y: this.player.y - 10, speed: b.speed, damage: b.damage, color: b.color, size: b.size });
    } else {
      this.bullets.push({ x: this.player.x - 12, y: this.player.y - 20, speed: b.speed, damage: b.damage, color: b.color, size: b.size });
      this.bullets.push({ x: this.player.x + 12, y: this.player.y - 20, speed: b.speed, damage: b.damage, color: b.color, size: b.size });
    }
  }

  spawnEnemy() {
    const types = [
      { name: "Drone", hp: 45, vy: 2.5, radius: 16, color: "#E040FB", points: 50 },
      { name: "Armored Beetle", hp: 110, vy: 1.8, radius: 24, color: "#00E676", points: 120 },
      { name: "Void Stalker", hp: 70, vy: 3.2, radius: 18, color: "#FF3D00", points: 90 }
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    this.enemies.push({
      ...t,
      x: Math.random() * (this.width - 100) + 50,
      y: -30,
      seed: Math.random() * 100,
      shootTimer: 0,
      shootInterval: Math.random() * 2 + 1.5
    });
  }

  spawnBoss() {
    this.wave = "BOSS PHASE";
    this.boss = {
      name: "CHÚA TỂ HƯ KHÔNG LEVIATHAN",
      x: this.width / 2,
      y: -100,
      targetY: 130,
      hp: 6000,
      maxHp: 6000,
      radius: 65,
      phase: 1,
      timer: 0,
      shootTimer: 0
    };
    sound.playExplosion(true);
    this.addPopup(this.width / 2, 200, "⚠️ CẢNH BÁO: LEVIATHAN OVERLORD XUẤT HIỆN! ⚠️", "#FF1744");
  }

  updateBoss(dt) {
    const b = this.boss;
    if (b.y < b.targetY) b.y += 1.5;
    b.x += Math.sin(performance.now() * 0.0015) * 2;
    b.timer += dt;
    b.shootTimer += dt;

    // Check boss phase transition
    if (b.hp < 3000 && b.phase === 1) {
      b.phase = 2;
      this.createShockwave(b.x, b.y, 400, "#FF1744");
      this.addPopup(b.x, b.y + 40, "PHASE 2: TỬ THẦN NỔI GIẬN!", "#FF1744");
    }

    const interval = b.phase === 2 ? 0.8 : 1.4;
    if (b.shootTimer > interval) {
      // Fire radial spread
      const count = b.phase === 2 ? 16 : 10;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        this.enemyBullets.push({
          x: b.x,
          y: b.y + 30,
          vx: Math.cos(a) * 4,
          vy: Math.sin(a) * 4,
          damage: 30
        });
      }
      b.shootTimer = 0;
    }

    // Bullet collision with Boss
    for (let j = this.bullets.length - 1; j >= 0; j--) {
      const bull = this.bullets[j];
      if (Math.hypot(bull.x - b.x, bull.y - b.y) < b.radius) {
        b.hp -= bull.damage;
        this.createSpark(bull.x, bull.y, bull.color);
        this.addPopup(b.x + (Math.random() * 40 - 20), b.y, `-${Math.round(bull.damage)}`, bull.color);
        this.bullets.splice(j, 1);
      }
    }

    if (b.hp <= 0) {
      sound.playExplosion(true);
      this.createExplosion(b.x, b.y, "#FFD700");
      this.score += 5000;
      this.boss = null;
      this.addPopup(this.width / 2, 250, "CHIẾN THẮNG! HẠ GỤC LEVIATHAN!", "#FFD700");
      setTimeout(() => this.gameOver(true), 2500);
    }
  }

  createSpark(x, y, color) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        alpha: 1,
        color
      });
    }
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        alpha: 1,
        color
      });
    }
  }

  gameOver(isWin = false) {
    this.running = false;
    if (this.onGameOver) this.onGameOver(isWin, this.score);
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake
    if (this.shakeTime > 0) {
      ctx.translate((Math.random() - 0.5) * this.shakeTime, (Math.random() - 0.5) * this.shakeTime);
    }

    // Space Background
    ctx.fillStyle = "#050714";
    ctx.fillRect(0, 0, this.width, this.height);

    // Render Stars
    this.stars.forEach((s) => {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Shockwaves & Particles
    this.particles.forEach((p) => {
      if (p.type === "shockwave") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, 3, 3);
      }
    });
    ctx.globalAlpha = 1;

    // Render Player Laser Beam (Skill E)
    if (this.player.laserBeam) {
      ctx.strokeStyle = this.fighter.glowColor;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y - 20);
      ctx.lineTo(this.player.x, 0);
      ctx.stroke();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y - 20);
      ctx.lineTo(this.player.x, 0);
      ctx.stroke();
    }

    // Render Bullets
    this.bullets.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Render Enemy Bullets
    this.enemyBullets.forEach((eb) => {
      ctx.fillStyle = "#FF1744";
      ctx.shadowColor = "#FF1744";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Render Enemies
    this.enemies.forEach((e) => {
      this.drawEnemy(ctx, e);
    });

    // Render Boss
    if (this.boss) {
      this.drawBoss(ctx, this.boss);
    }

    // Render Player Ship
    if (!this.player.stealth || Math.floor(performance.now() / 100) % 2 === 0) {
      this.drawPlayer(ctx);
    }

    // Render Popups (Damage Numbers)
    this.popups.forEach((pop) => {
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.font = "bold 14px Orbitron";
      ctx.fillText(pop.text, pop.x - 20, pop.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Shield Aura
    if (p.shield) {
      ctx.strokeStyle = "#00E5FF";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Thruster exhaust
    ctx.fillStyle = Math.random() > 0.5 ? "#FF9100" : "#FF3D00";
    ctx.beginPath();
    ctx.moveTo(-10, 24);
    ctx.lineTo(0, 38 + Math.random() * 8);
    ctx.lineTo(10, 24);
    ctx.fill();

    // Distinct Fighter Silhouette
    ctx.fillStyle = this.fighter.color;
    ctx.shadowColor = this.fighter.glowColor;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    // Imperial Starfighter Body Shape
    ctx.moveTo(0, -26); // Nose
    ctx.lineTo(14, -8);
    ctx.lineTo(26, 12); // Right wing tip
    ctx.lineTo(16, 22);
    ctx.lineTo(6, 16);
    ctx.lineTo(0, 20); // Tail
    ctx.lineTo(-6, 16);
    ctx.lineTo(-16, 22);
    ctx.lineTo(-26, 12); // Left wing tip
    ctx.lineTo(-14, -8);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = "#E0F7FA";
    ctx.beginPath();
    ctx.ellipse(0, -6, 5, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawEnemy(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = e.frozen ? "#80DEEA" : e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;

    // Organic Alien Shape
    ctx.beginPath();
    ctx.moveTo(0, e.radius);
    ctx.lineTo(e.radius, -e.radius / 2);
    ctx.lineTo(0, -e.radius);
    ctx.lineTo(-e.radius, -e.radius / 2);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#FFF";
    ctx.fillRect(-4, -2, 2, 4);
    ctx.fillRect(2, -2, 2, 4);

    ctx.restore();
  }

  drawBoss(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);

    // Overlord Leviathan
    ctx.fillStyle = b.phase === 2 ? "#D50000" : "#4A148C";
    ctx.shadowColor = "#FF1744";
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();

    // Tentacles / Mandibles
    ctx.strokeStyle = "#FF4081";
    ctx.lineWidth = 6;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 18, b.radius - 10);
      ctx.lineTo(i * 24, b.radius + 25 + Math.sin(performance.now() * 0.005 + i) * 10);
      ctx.stroke();
    }

    // Glowing Core
    ctx.fillStyle = "#FFEB3B";
    ctx.beginPath();
    ctx.arc(0, -10, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
