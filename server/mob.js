import { ENTITIES } from './game.js';
import { Player } from './player.js';
import { entityMap } from '../public/shared/entitymap.js';

export class Mob {
    constructor(id, x, y, type) {
        this.id = id;

        this.x = x;
        this.y = y;

        this.score = entityMap.MOBS[type].score;

        this.health = entityMap.MOBS[type].baseHealth;
        this.maxHealth = entityMap.MOBS[type].baseHealth;

        this.angle = 0
        this.radius = entityMap.MOBS[type].radius;
        this.speed = entityMap.MOBS[type].speed;

        this.huntAimInterval = null;
        this.isAlarmed = false;
        this.startHuntingTime = 0;
        this.target = null;
        this.alarmDuration = entityMap.MOBS[type].alarmDuration;

        this.type = type;

        ENTITIES.MOBS[id] = this;

        this.turn();
    }
    move() {
        const rad = this.angle * Math.PI / 180;
        // move
        this.x += Math.cos(rad) * this.speed;
        this.y += Math.sin(rad) * this.speed
        this.resolveCollisions();
        this.clamp();
    }
    resolveCollisions() {
        // check collisions with players
        for (const player of Object.values(ENTITIES.PLAYERS)) {
            const distance = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

            // check if touching (minus some)
            if (distance <= this.radius + player.radius) {
                // resolve collision
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const dx = Math.cos(angle) * 10
                const dy = Math.sin(angle) * 10

                this.x -= dx;
                this.y -= dy;
                player.x += dx;
                player.y += dy;

                // if its a hostile mob and its hunting, damage the player
                if (entityMap.MOBS[this.type].isHostile && this.isAlarmed && this.target.id === player.id) {
                    // check the player's last death time to stop targetting it after it died
                    player.damage(entityMap.MOBS[this.type].damage)
                }
            }
        }
    }
    turn() {
        if (this.huntAimInterval) return; // don't turn if hunting a player
        
        this.angle = Math.floor(Math.random() * 361) - 180; // rand angle between -180 and 180 (inclusive)
        setTimeout(() => {
            this.turn();
        }, Math.floor(Math.random() * 3001) + 3000) // every 3-6 seconds
    }
    clamp() {
        // clamp inside map bounds
        if (this.x < 0 + this.radius) this.x = 0 + this.radius;
        if (this.y < 0 + this.radius) this.y = 0 + this.radius;
        if (this.x > 10000 - this.radius) this.x = 10000 - this.radius;
        if (this.y > 10000 - this.radius) this.y = 10000 - this.radius;
    }
    alarm(shooter) {
        this.target = shooter;
        
        if (this.isAlarmed) return; // already alarmed
        this.isAlarmed = true;
        this.startHuntingTime = performance.now();
        // speed boost
        this.speed = entityMap.MOBS[this.type].speed * 2.5;
        
        const isHostile = entityMap.MOBS[this.type].isHostile;
        if (isHostile) {
            // turn towards shooter and chase
            this.huntAimInterval = setInterval(() => {
                // constantly update angle to chase shooter
                if (this.target.lastDiedTime > this.startHuntingTime) {
                    // clear target
                    this.target = null;
                    this.speed = entityMap.MOBS[this.type].speed; // reset speed
                    
                    this.isAlarmed = false; // stop being alarmed if the player died
                    clearInterval(this.huntAimInterval);
                    this.huntAimInterval = null;
                    this.turn(); // start wandering again
                    return;
                }
                this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x) * 180 / Math.PI;
            }, 100);
        } else {
            // turn away from shooter once and run
            this.angle = Math.atan2(this.y - shooter.y, this.x - shooter.x) * 180 / Math.PI;
            this.isAlarmed = false; // non-hostile mobs don't stay alarmed
        }

        // stop hunting / running away after 3 seconds
        setTimeout(() => {
            // stop the aim interval if exists (for mobs that hunt);
            if (this.huntAimInterval) {
                clearInterval(this.huntAimInterval);
                this.huntAimInterval = null;
            }

            // make it not alarmed anymore in case it still was
            this.isAlarmed = false;

            // reset speed
            this.speed = entityMap.MOBS[this.type].speed;
        }, this.alarmDuration);
    }
    die(killer) {
        // give the killer score if they're a player (from player class)
        if (killer instanceof Player) killer.score += this.score;
        
        // delete this mob
        ENTITIES.deleteEntity('mob', this.id);

        // spawn a similar mob somewhere else on the map
        ENTITIES.newEntity({
            entityType: 'mob',
            id: this.id,
            x: Math.floor(Math.random() * 10000),
            y: Math.floor(Math.random() * 10000),
            type: this.type,
            type: this.type,
        });
    }
}


// spawn some mobs in random positions!
setTimeout(() => {
    for (let i = 1; i <= 100; i++) {
        new Mob(i, Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000), 1);
    }
    for (let i = 101; i <= 201; i++) {
        new Mob(i, Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000), 2);
    }
    for (let i = 202; i <= 302; i++) {
        new Mob(i, Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000), 3);
    }
}, 100);