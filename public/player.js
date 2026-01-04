import {
    LC
} from './client.js';
import {
    ENTITIES
} from './game.js';
import {
    myId
} from './client.js';
import {
    camera
} from './client.js';
import { TPS } from './shared/entitymap.js';

export class Player {
    constructor(id, x, y) {
        this.id = id;

        this.x = x;
        this.newX = x;
        this.y = y;
        this.newY = y;

        this.username = "";

        this.newAngle = 0;
        this.angle = 0;

        this.radius = 30;

        ENTITIES.PLAYERS[id] = this;
    }
    draw() {
        const lerpFactor = (TPS.client / TPS.server) / 10;
        
        if (typeof this.newX === 'undefined' || typeof this.newY === 'undefined') return;

        // lerp if x, y is NOT UNDEFINED, else don't lerp and change x, y directly.
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

        // target is local player
        camera.target.x = ENTITIES.PLAYERS[myId].x;
        camera.target.y = ENTITIES.PLAYERS[myId].y;

        camera.x = camera.target.x - (LC.width / 2);
        camera.y = camera.target.y - (LC.height / 2);

        const screenPosX = this.x - camera.x;
        const screenPosY = this.y - camera.y;


        // lerp angle for other players
        if (this.id != myId) {
            this.angle += (((this.newAngle - this.angle + 540) % 360 - 180) * lerpFactor);
        }

        // keep angle within range
        this.angle = ((this.angle + 180) % 360 + 360) % 360 - 180;

        const rad = this.angle * Math.PI / 180;

        // actual image
        LC.drawImage({
            name: 'player-default',
            pos: [screenPosX - this.radius, screenPosY - this.radius],
            size: [this.radius * 2, this.radius * 2],
            rotation: this.angle
        });

        // draw username as text
        const usernameText = this.username;
        const idText = ` (${this.id})`;

        const usernameMetrics = LC.measureText({ text: usernameText, font: 'bold 16px Arial' });
        const idMetrics = LC.measureText({ text: idText, font: 'bold 16px Arial' });

        const totalWidth = usernameMetrics.width + idMetrics.width;

        LC.drawText({
            text: usernameText,
            pos: [screenPosX - totalWidth / 2, screenPosY - this.radius - 5],
            color: 'white',
            font: 'bold 16px Arial'
        });
        LC.drawText({
            text: idText,
            pos: [screenPosX - totalWidth / 2 + usernameMetrics.width, screenPosY - this.radius - 5],
            color: 'lightgray',
            font: 'bold 16px Arial'
        });
    }
}