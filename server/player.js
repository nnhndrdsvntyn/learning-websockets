import { ENTITIES } from './game.js';
import { entityMap } from '../public/shared/entitymap.js';

export class Player {
    constructor(id, x, y) {
        this.id = id;

        this.speed = entityMap.PLAYERS.baseSpeed;
        this.radius = entityMap.PLAYERS.baseRadius;

        this.angle = 0;

        this.username;
        this.chatMessage;

        this.x = x;
        this.y = y;

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

        this.resolveCollisions();
        this.clamp();
    }
    resolveCollisions() {
        for (const player of Object.values(ENTITIES.PLAYERS)) {
            if (player.id === this.id) continue; // don't check collisions with self.

            const distance = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

            // check if touching (minus some)
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
}