import { ENTITIES } from './game.js';
import { entityMap } from '../public/shared/entitymap.js';
export class Player {
    constructor(id, x, y) {
        this.id = id;

        this.speed = entityMap.PLAYERS.baseMovementSpeed;
        this.radius = entityMap.PLAYERS.baseRadius;

        this.angle = 0;

        this.health = 100;
        this.maxHealth = 100;

        this.score = 10;
        this.level = 1;

        this.lastDamagedTime = 0;
        this.lastDiedTime = 0;

        this.username;
        this.chatMessage = '';

        this.x = x;
        this.y = y;

        this.lastAttackTime = 0;
        this.attackCooldownTime = entityMap.PLAYERS.baseAttackCooldown;
        this.attacking = false;
        this.keys = {w: 0, a: 0, s: 0, d: 0};

        ENTITIES.PLAYERS[id] = this;
    }
    move() {
        const oldX = this.x;
        const oldY = this.y;
        
        if (this.keys['w']) this.y -= this.speed;
        if (this.keys['a']) this.x -= this.speed;
        if (this.keys['s']) this.y += this.speed;
        if (this.keys['d']) this.x += this.speed;
    }
    attack() {
        if (Date.now() - this.lastAttackTime < this.attackCooldownTime || !this.attacking) return;
        this.lastAttackTime = Date.now();
        
        const spawnProjectile = (angleOffset, shooter) => {
            let projectileId = Math.floor(Math.random() * 100000); // Use a larger range for IDs
            while(projectileId in ENTITIES.PROJECTILES) {
                projectileId = Math.floor(Math.random() * 100000);
            }

            const projectileAngle = shooter.angle + angleOffset;
            const rad = projectileAngle * Math.PI / 180;
            const xOffset = Math.cos(rad) * shooter.radius; // spawn outside player
            const yOffset = Math.sin(rad) * shooter.radius; // spawn outside player

            ENTITIES.newEntity({
                entityType: 'projectile',
                id: projectileId,
                x: shooter.x + xOffset,
                y: shooter.y + yOffset,
                angle: projectileAngle,
                type: this.level,
                shooter: shooter
            });
        }

        spawnProjectile(0, this);
    }
    resolveCollisions() {
        for (const player of Object.values(ENTITIES.PLAYERS)) {
            if (player.id === this.id) continue; // don't check collisions with self.

            const distance = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

            // check if touching
            if (distance <= this.radius + player.radius) {
                // resolve collision
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const dx = Math.cos(angle) * 3
                const dy = Math.sin(angle) * 3
                this.x -= dx;
                this.y -= dy;
                player.x += dx;
                player.y += dy;
            }
        }
    }
    clamp() {
        // clamp inside map bounds
        if (this.x < 0 + this.radius) this.x = 0 + this.radius;
        if (this.y < 0 + this.radius) this.y = 0 + this.radius;
        if (this.x > 10000 - this.radius) this.x = 10000 - this.radius;
        if (this.y > 10000 - this.radius) this.y = 10000 - this.radius;
    }
    addScore(points) {
        // determine new level
        for (const level in entityMap.PLAYERS.levels) {
            if (this.score + points >= entityMap.PLAYERS.levels[level]) {
                this.level = parseInt(level);
            }
        }
        
        this.score += points;
    }
    damage(health) {
        if (performance.now() - this.lastDamagedTime < 250) return; // invulnerable for 500ms

        this.lastDamagedTime = performance.now();
        this.health -= health;
        if (this.health <= 0) {
            this.die();
        }
    }
    die(killer) {
        // set last died time
        this.lastDiedTime = performance.now();
        
        // give killer score if they are a player
        if (killer instanceof Player) killer.addScore(this.score);
        
        this.health = 100;
        this.maxHealth = 100;

        this.x = 5000;
        this.y = 5000;
        this.score = 0; // reset score
        this.attacking = false;
        this.keys = {w: 0, a: 0, s: 0, d: 0};
    }
    process() {
        this.move();
        this.resolveCollisions();
        this.clamp();
        this.attack();
    }
}