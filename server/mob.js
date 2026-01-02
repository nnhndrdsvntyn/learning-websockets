import { ENTITIES } from './game.js';
import { entityMap } from '../public/shared/entitymap.js';

export class Mob {
    constructor(id, x, y, type) {
        this.id = id;

        this.x = x;
        this.y = y;

        this.angle = 0
        this.radius = entityMap.MOBS[type].radius;
        this.speed = entityMap.MOBS[type].speed;

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
                const dx = Math.cos(angle) * this.radius
                const dy = Math.sin(angle) * this.radius

                this.x -= dx;
                this.y -= dy;
                player.x += dx;
                player.y += dy;
            }
        }
    }
    turn() {
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
}


// spawn some mobs in random positions!
setTimeout(() => {
    for (let i = 1; i <= 100; i++) {
        new Mob(i, Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000), 1);
    }
});