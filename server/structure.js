import { entityMap } from '../public/shared/entitymap.js';
import { ENTITIES } from './game.js';

export class Structure {
    constructor(id, x, y, type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;

        this.radius = entityMap.STRUCTURES[type].radius;

        ENTITIES.STRUCTURES[id] = this;
    }
    handleCollisions() {
        if (entityMap.STRUCTURES[this.type].noCollisions) return;
        
        // check collisions with players
        for (const player of Object.values(ENTITIES.PLAYERS)) {
            if (this.type === 1) return; // spawn zones don't handle collisions with players.
            const distance = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

            // check if touching (minus some)
            if (distance <= this.radius + player.radius - 30) {
                // resolve collision
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const dx = Math.cos(angle) * player.radius
                const dy = Math.sin(angle) * player.radius

                // only move the player
                player.x += dx;
                player.y += dy;
            }
        }
    }
}