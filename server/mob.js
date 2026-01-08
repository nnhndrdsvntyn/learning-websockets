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

        this.angle = Math.random() * Math.PI * 2 - Math.PI;
        this.radius = entityMap.MOBS[type].radius;
        this.speed = entityMap.MOBS[type].speed;

        this.isAlarmed = false;
        this.startHuntingTime = 0;
        this.lastTurnTime = 0
        this.nextTurnDelay = Math.floor(Math.random() * 3001) + 3000;
        this.target = null;
        this.alarmDuration = entityMap.MOBS[type].alarmDuration;

        this.type = type;

        ENTITIES.MOBS[id] = this;
    }
    move() {
        // move
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
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
        if (this.isAlarmed) {
            if (this.target && entityMap.MOBS[this.type].isHostile) { // turn towards target if hostile
                this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                return; // don't run code after this
            } else if (this.target && !entityMap.MOBS[this.type].isHostile) { // turn away from target if not hostile
                this.angle = Math.atan2(this.y - this.target.y, this.x - this.target.x);
                return; // don't run code after this
            } else {
                // no target, stop being alarmed and reset speed
                this.isAlarmed = false;
                this.speed = entityMap.MOBS[this.type].speed;
                return;
            }
        } else {
            if (performance.now() - this.lastTurnTime > this.nextTurnDelay) {
                this.angle = Math.random() * Math.PI * 2 - Math.PI; // rand angle between -PI and PI
                this.lastTurnTime = performance.now();

                this.nextTurnDelay = Math.floor(Math.random() * 3001) + 3000;
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
    alarm(shooter) {
        this.target = shooter;
        
        if (this.isAlarmed) return; // already alarmed
        
        this.isAlarmed = true;
        this.startHuntingTime = performance.now();

        // speed boost
        this.speed = entityMap.MOBS[this.type].speed * 1.5;
        
    }
    die(killer) {
        // give the killer score if they're a player (from player class)
        if (killer instanceof Player) killer.addScore(this.score);
        
        // delete this mob
        ENTITIES.deleteEntity('mob', this.id);

        // spawn a similar mob somewhere else on the map
        ENTITIES.newEntity({
            entityType: 'mob',
            id: this.id,
            x: Math.floor(Math.random() * 10000),
            y: Math.floor(Math.random() * 10000),
            type: this.type,
        });
    }
    process() {
        const currentTime = performance.now();

        if (this.isAlarmed) {
            if (currentTime - this.startHuntingTime > this.alarmDuration) {
                this.isAlarmed = false;
                this.speed = entityMap.MOBS[this.type].speed;
                this.target = null;
            } else if (this.target) {
                if (entityMap.MOBS[this.type].isHostile) {
                    if (this.target.lastDiedTime > this.startHuntingTime) {
                        this.isAlarmed = false;
                        this.speed = entityMap.MOBS[this.type].speed;
                        this.target = null;
                    }
                }
            } else {
                this.isAlarmed = false;
                this.speed = entityMap.MOBS[this.type].speed;
            }
        }
        // main stuff
        this.turn();
        this.move();
        this.resolveCollisions();
        this.clamp();
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