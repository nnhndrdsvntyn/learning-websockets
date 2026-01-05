import express from 'express';
import {
    WebSocketServer
} from 'ws';

import {
    parsePacket
} from './server/parser.js';
import {
    ENTITIES,
    buildInitPacket
} from './server/game.js';

const app = express();
const PORT = 3000;

app.use(express.static('public'));

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket setup
export const wss = new WebSocketServer({
    server
});

wss.on('connection', (ws) => {
    let newId = Math.floor(Math.random() * 4294967295) + 1;
    while (ENTITIES.playerIds.has(newId)) {
        newId = Math.floor(Math.random() * 4294967295) + 1;
    }
    ws.id = newId;
    ws.send(ws.id);

    ENTITIES.playerIds.add(ws.id);

    console.log('Client connected with id:', ws.id);
    ENTITIES.newEntity({
        entityType: 'player',
        id: ws.id,
        x: 5000,
        y: 5000,
        angle: 0,
    });

    ws.on('message', (data) => {
        parsePacket(data, ws);
    });

    ws.on('close', () => {
        console.log('Client disconnected with id:', ws.id);
        ENTITIES.deleteEntity('player', ws.id);
    });
});

// main update loop
function update() {
    // move players
    for (const id in ENTITIES.PLAYERS) {
        const player = ENTITIES.PLAYERS[id];
        player.move();
        player.attack();
    }
    // move mobs
    for (const id in ENTITIES.MOBS) {
        const mob = ENTITIES.MOBS[id];
        mob.move();
    }
    // move projectiles
    for (const id in ENTITIES.PROJECTILES) {
        const projectile = ENTITIES.PROJECTILES[id];
        projectile.move();
    }
    // handle structure collisions
    for (const id in ENTITIES.STRUCTURES) {
        const structure = ENTITIES.STRUCTURES[id];
        structure.handleCollisions();
    }

    // gather all players
    const allPlayers = Object.values(ENTITIES.PLAYERS);

    // gather all mobs
    const allMobs = Object.values(ENTITIES.MOBS);

    // gather all projectiles
    const allProjectiles = Object.values(ENTITIES.PROJECTILES);

    // send updates
    wss.clients.forEach(ws => {
        const localPlayer = ENTITIES.PLAYERS[ws.id];
        if (!localPlayer) return;

        const playersToSend = [];
        for (const player of allPlayers) {
            const distance = Math.sqrt(Math.pow(player.x - localPlayer.x, 2) + Math.pow(player.y - localPlayer.y, 2)); // distance between player and local player
            if (distance <= 1000) {
                playersToSend.push(player);
            }
        }

        const mobsToSend = [];
        for (const mob of allMobs) {
            const distance = Math.sqrt(Math.pow(mob.x - localPlayer.x, 2) + Math.pow(mob.y - localPlayer.y, 2));
            if (distance <= 1000) {
                mobsToSend.push(mob);
            }
        }

        const projectilesToSend = [];
        for (const projectile of allProjectiles) {
            const distance = Math.sqrt(Math.pow(projectile.x - localPlayer.x, 2) + Math.pow(projectile.y - localPlayer.y, 2));
            if (distance <= 1000) {
                projectilesToSend.push(projectile);
            }
        }

        if (playersToSend.length > 0 || mobsToSend.length > 0 || projectilesToSend.length > 0) {
            // calculate size
            let bufferLength = 0;
            bufferLength += 1; // packet type
            bufferLength += 1; // player count
            bufferLength += (playersToSend.length * 20) // id(4) + x(2) + y(2) angle(2) + health(2) + maxHealh(2) + score(4) + username length(1) + chat message length(1)

            for (const player of playersToSend) {
                bufferLength += Buffer.byteLength(player.username); // dynamic, based on player's username. so we need a for loop to check for this.
            }

            for (const player of playersToSend) {
                bufferLength += Buffer.byteLength(player.chatMessage); // dynamic, based on player's chat message. so we need a for loop to check for this.
            }

            bufferLength += 2; // mob count
            bufferLength += mobsToSend.length * 15; // id(4) + x(2) + y(2) + angle(2) + health(2) + maxHealth(2) + type(1)
            
            bufferLength += 2; // projectile count
            bufferLength += projectilesToSend.length * 11; // id(4) + x(2) + y(2) + angle(2) + type(1)

            const buffer = new ArrayBuffer(bufferLength);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset++, 2); // 2 for update packet
            view.setUint8(offset++, playersToSend.length);

            for (const player of playersToSend) {
                const username = player.username;
                const chatMessage = player.chatMessage;

                view.setUint32(offset, player.id); offset += 4;
                view.setUint16(offset, player.x); offset += 2;
                view.setUint16(offset, player.y); offset += 2;
                view.setInt16(offset, player.angle); offset += 2;
                view.setUint16(offset, player.health); offset += 2;
                view.setUint16(offset, player.maxHealth); offset += 2;
                view.setUint32(offset, player.score); offset += 4;

                const usernameBuf = Buffer.from(username);
                view.setUint8(offset++, usernameBuf.length); // username length
                for (const byte of usernameBuf) {
                    view.setUint8(offset++, byte);
                }

                const chatMessageBuf = Buffer.from(chatMessage);
                view.setUint8(offset++, chatMessageBuf.length); // chat message length
                for (const byte of chatMessageBuf) {
                    view.setUint8(offset++, byte);
                }
            }

            view.setUint16(offset, mobsToSend.length); offset += 2;
            for (const mob of mobsToSend) {
                view.setUint32(offset, mob.id); offset += 4;
                view.setUint16(offset, mob.x); offset += 2;
                view.setUint16(offset, mob.y); offset += 2;
                view.setInt16(offset, mob.angle); offset += 2;
                view.setUint16(offset, mob.health); offset += 2;
                view.setUint16(offset, mob.maxHealth); offset += 2;
                view.setUint8(offset++, mob.type);
            }

            view.setUint16(offset, projectilesToSend.length); offset += 2;
            for (const projectile of projectilesToSend) {
                view.setUint32(offset, projectile.id); offset += 4;
                view.setUint16(offset, projectile.x); offset += 2;
                view.setUint16(offset, projectile.y); offset += 2;
                view.setInt16(offset, projectile.angle); offset += 2;
                view.setUint8(offset++, projectile.type);
            }

            ws.send(buffer);
        }
    });
}

import { TPS } from './public/shared/entitymap.js';
setInterval(update, 1000 / TPS.server);