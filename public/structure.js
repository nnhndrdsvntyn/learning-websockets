import { ENTITIES } from './game.js';
import { entityMap } from './shared/entitymap.js';
import { LC, camera } from './client.js';

export class Structure {
    constructor(id, x, y, type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;

        this.radius = entityMap.STRUCTURES[type].radius;

        ENTITIES.STRUCTURES[id] = this;
    }
    draw() {
        const screenPosX = this.x - camera.x;
        const screenPosY = this.y - camera.y;

        LC.drawImage({
            name: entityMap.STRUCTURES[this.type].imgName,
            pos: [screenPosX - this.radius, screenPosY - this.radius],
            size: [this.radius * 2, this.radius * 2]
        });
    }
}