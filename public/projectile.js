import { ENTITIES } from './game.js';
import { entityMap } from './shared/entitymap.js';
import { LC, camera } from './client.js';
import { TPS } from './shared/entitymap.js';

export class Projectile {
    constructor(id, x, y, angle, type) {
        this.id = id;

        this.x = x;
        this.newX = x;
        this.y = y;
        this.newY = y;

        this.angle = angle;
        this.newAngle = angle;

        this.type = type;
        this.radius = 10;

        ENTITIES.PROJECTILES[id] = this;
    }
    draw() {
        const lerpFactor = (TPS.client / TPS.server) / 10;
        
        if (typeof this.newX === 'undefined' || typeof this.newY === 'undefined') return;

        // lerp if x, y is NOT UNDEFINED (IS DEFINED), else don't lerp and change x, y directly.
        if (typeof this.x !== 'undefined') {
            this.x = this.x + (this.newX - this.x) * lerpFactor;
        } else {
            this.x = this.newX
        }
        if (typeof this.y !== 'undefined') {
            this.y = this.y + (this.newY - this.y) * lerpFactor;
        } else {
            this.y = this.newY
        };

        const screenPosX = this.x - camera.x;
        const screenPosY = this.y - camera.y;


        // lerp angle for mobs
        this.angle += (((this.newAngle - this.angle + 540) % 360 - 180) * lerpFactor);

        // keep angle within range
        this.angle = ((this.angle + 180) % 360 + 360) % 360 - 180;
        
        LC.drawImage({
            name: entityMap.PROJECTILES[this.type].imgName,
            pos: [screenPosX - this.radius, screenPosY - this.radius],
            angle: this.angle,
            size: [this.radius * 2, this.radius * 2],
            rotation: this.angle,
        })
        
        /*
        LC.drawCircle({
            pos: [screenPosX, screenPosY],
            radius: this.radius,
            color: 'red',
            transparency: 0.5
        });
        */
    }
}