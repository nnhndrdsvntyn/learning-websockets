import {
    ENTITIES
} from './game.js';
import {
    myId,
    camera,
    LC
} from './client.js';
import {
    TPS,
    entityMap
} from './shared/entitymap.js';
import {
    Settings
} from './client.js';

export class Player {
    constructor(id, x, y) {
        this.id = id;

        this.x = x;
        this.newX = x;
        this.y = y;
        this.newY = y;

        this.score = 0;
        this.newScore = 0;

        this.swingState = 0;
        this.newSwingState = 0;
        this.swordAngleOffset = -Math.PI / 2;

        this.level = 1;

        this.health = undefined;
        this.maxHealth = undefined;

        this.username = "";
        this.chatMessage = "";

        this.newAngle = 0;
        this.angle = 0;

        this.radius = entityMap.PLAYERS.baseRadius;

        ENTITIES.PLAYERS[id] = this;
    }
    draw() {
        const lerpFactor = (TPS.clientCapped / TPS.server) / 10;

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
            this.angle += (((this.newAngle - this.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI) * lerpFactor);
        }

        // keep angle within range
        this.angle = ((this.angle + Math.PI) % (Math.PI * 2) + (Math.PI * 2)) % (Math.PI * 2) - Math.PI;

        // actual image
        LC.drawImage({
            name: entityMap.PLAYERS.imgs[this.level].name,
            pos: [screenPosX - this.radius, screenPosY - this.radius],
            size: [this.radius * 2, this.radius * 2],
            rotation: this.angle,
        });

        // draw health as bar
        if (this.health !== undefined && this.maxHealth !== undefined) {
            const barWidth = this.radius * 2;
            const barHeight = 5;
            const healthPercentage = this.health / this.maxHealth;

            // Background of the health bar
            LC.drawRect({
                pos: [screenPosX - barWidth / 2, screenPosY + this.radius + 5],
                size: [barWidth, barHeight],
                color: 'red',
                cornerRadius: 2
            });

            // Foreground of the health bar
            LC.drawRect({
                pos: [screenPosX - barWidth / 2, screenPosY + this.radius + 5],
                size: [barWidth * healthPercentage, barHeight],
                color: 'lime',
                cornerRadius: 2
            });
        }

        // draw chat
        if (this.chatMessage !== "") {
            const chatText = this.chatMessage;
            const chatMetrics = LC.measureText({
                text: chatText,
                font: '17px Arial'
            });
            const padding = 5;
            LC.drawRect({ // chat bubble
                pos: [screenPosX - chatMetrics.width / 2 - padding, screenPosY - this.radius - 30 - 20 - padding],
                size: [chatMetrics.width + padding * 2, 20 + padding * 1.5],
                color: 'rgba(64, 64, 64, 0.7)',
                cornerRadius: 5
            });


            LC.drawText({
                text: chatText,
                pos: [screenPosX - chatMetrics.width / 2, screenPosY - this.radius - 35],
                color: 'white',
                font: '17px Arial'
            });
        }

        // draw username as text
        const usernameText = `${this.level} | ${this.username}`;
        const usernameMetrics = LC.measureText({
            text: usernameText,
            font: 'bold 16px Arial'
        });
        let idText = "";
        let idMetrics = {
            width: 0
        };

        if (Settings.showIds) {
            idText = ` (${this.id})`;
            idMetrics = LC.measureText({
                text: idText,
                font: 'bold 16px Arial'
            });
        }

        const totalWidth = usernameMetrics.width + idMetrics.width;

        LC.drawText({
            text: usernameText,
            pos: [screenPosX - totalWidth / 2, screenPosY - this.radius - 5],
            color: 'white',
            font: 'bold 16px Arial'
        });

        if (Settings.showIds) {
            LC.drawText({
                text: idText,
                pos: [screenPosX - totalWidth / 2 + usernameMetrics.width, screenPosY - this.radius - 5],
                color: 'lightgray',
                font: 'bold 16px Arial'
            });
        };

        /*
        LC.drawCircle({
            pos: [screenPosX, screenPosY],
            radius: this.radius,
            color: 'red',
            transparency: 0.5
        });
        */

        // lerp swing state
        const delta = this.newSwingState - this.swingState;

        // snap if delta is tiny
        if (Math.abs(delta) < 0.01) {
            this.swingState = this.newSwingState;
        } else if (this.newSwingState < this.swingState) {
            // if the new swing state is lower than the current, then automcailly just set it, dont lerp.
            this.swingState = this.newSwingState;
        } else {
            this.swingState += delta * lerpFactor;
        }

        this.swordAngleOffset = (this.swingState * (Math.PI / 6)) - (Math.PI / 2);
        const angleRad = this.angle + this.swordAngleOffset;

        const swordLength = entityMap.SWORDS.imgs[this.level].swordLength;
        const swordHeight = swordLength / 3;

        // move origin to the handle instead of center
        const offsetX = Math.cos(angleRad) * (this.radius + swordLength / 2);
        const offsetY = Math.sin(angleRad) * (this.radius + swordLength / 2);

        LC.drawImage({
            name: `swords-sword${this.level}`,
            pos: [
                screenPosX + offsetX - swordLength / 2,
                screenPosY + offsetY - swordHeight / 2
            ],
            size: [swordLength, swordHeight],
            rotation: angleRad
        });
    }
}