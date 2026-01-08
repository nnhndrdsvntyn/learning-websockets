import { ENTITIES } from './game.js';
import { entityMap } from '../public/shared/entitymap.js';

export class Projectile {
    constructor(id, x, y, angle, type, shooter) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle;

        this.type = type;
        this.speed = entityMap.PROJECTILES[type].speed;
        this.radius = entityMap.PROJECTILES[type].radius;
        this.distanceTraveled = 0;

        let spawnTime = performance.now();

        this.shooter = shooter;

        ENTITIES.PROJECTILES[id] = this;
    }
    move() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.distanceTraveled += this.speed;

        this.resolveCollisions();
    }
    resolveCollisions() {
        // check structures
        for (const id in ENTITIES.STRUCTURES) {
            const structure = ENTITIES.STRUCTURES[id];
            const distance = Math.sqrt(Math.pow(structure.x - this.x, 2) + Math.pow(structure.y - this.y, 2));

            if (distance <= structure.radius + this.radius) {
                ENTITIES.deleteEntity('projectile', this.id);
                return;
            }
        }
        
        // check with players
        for (const id in ENTITIES.PLAYERS) {
            const player = ENTITIES.PLAYERS[id];
            if (player.id === this.shooter.id) continue;

            const distance = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

            if (distance <= player.radius + this.radius) {
                // damage player
                player.health -= entityMap.PROJECTILES[this.type].damage;
                // knock player back
                const knockbackAngle = Math.atan2(player.y - this.shooter.y, player.x - this.shooter.x);
                player.x += Math.cos(knockbackAngle) * 10;
                player.y += Math.sin(knockbackAngle) * 10;
                player.clamp();
                ENTITIES.deleteEntity('projectile', this.id);

                // check if player should die, and kill them.
                if (player.health <= 0) {
                    player.die(this.shooter);
                }
                return;
            }
        }
        // check mobs
        for (const id in ENTITIES.MOBS) {
            const mob = ENTITIES.MOBS[id];
            if (mob.id === this.shooter.id) continue;

            const distance = Math.sqrt(Math.pow(mob.x - this.x, 2) + Math.pow(mob.y - this.y, 2));

            if (distance <= mob.radius + this.radius) {
                // damage mob
                mob.health -= entityMap.PROJECTILES[this.type].damage;

                // knock mob back
                const knockbackAngle = Math.atan2(mob.y - this.shooter.y, mob.x - this.shooter.x);
                mob.x += Math.cos(knockbackAngle) * entityMap.PROJECTILES[this.type].knockbackStrength;
                mob.y += Math.sin(knockbackAngle) * entityMap.PROJECTILES[this.type].knockbackStrength;
                mob.clamp();
                mob.alarm(this.shooter);
                ENTITIES.deleteEntity('projectile', this.id);

                // check if mob should die, and kill them.
                if (mob.health <= 0) {
                    mob.die(this.shooter);
                }
                return;
            }
        }
    }
    process() {
        if (this.distanceTraveled > entityMap.PROJECTILES[this.type].maxDistance) {
            ENTITIES.deleteEntity('projectile', this.id);
        }
        
        this.move();
        this.resolveCollisions();
    }
}