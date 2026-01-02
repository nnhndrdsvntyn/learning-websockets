import { ENTITIES } from './game.js';
import { entityMap } from './shared/entitymap.js';
import { LC, camera } from './client.js';

export class Mob {
    constructor(id, x, y, type) {
        this.id = id;


        this.x = x;
        this.newX = x;
        this.y = y;
        this.newY = y;

        this.angle = 0
        this.newAngle = 0;
        
        this.radius = 30
        this.type = type;

        ENTITIES.MOBS[id] = this;
    }
    draw() {
        if (typeof this.newX === 'undefined' || typeof this.newY === 'undefined') return;

        // lerp if x, y is NOT UNDEFINED (IS DEFINED), else don't lerp and change x, y directly.
        if (typeof this.x !== 'undefined') {
            this.x = this.x + (this.newX - this.x) * 0.3;
        } else {
            this.x = this.newX
        }
        if (typeof this.y !== 'undefined') {
            this.y = this.y + (this.newY - this.y) * 0.3;
        } else {
            this.y = this.newY
        };

        const screenPosX = this.x - camera.x;
        const screenPosY = this.y - camera.y;


        // lerp angle for mobs
        this.angle += (((this.newAngle - this.angle + 540) % 360 - 180) * 0.3);

        // keep angle within range
        this.angle = ((this.angle + 180) % 360 + 360) % 360 - 180;

        LC.drawImage({
            name: entityMap.MOBS[this.type].imgName,
            pos: [screenPosX - this.radius, screenPosY - this.radius],
            size: [this.radius * 2, this.radius * 2],
            rotation: this.angle
        })
    }
}