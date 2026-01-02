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
    let newId = Math.floor(Math.random() * 100) + 1;
    while (ENTITIES.playerIds.has(newId)) {
        newId = Math.floor(Math.random() * 100) + 1;
    }
    ws.id = newId;
    ws.send(ws.id);

    ENTITIES.playerIds.add(ws.id);
    ENTITIES.newEntity({
        type: 'player',
        id: ws.id,
        x: 5000,
        y: 5000
    });
    ws.send(buildInitPacket(ws.id));

    console.log('Client connected with id:', ws.id);

    ws.on('message', (data) => {
        parsePacket(data, ws.id);
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
    }
    // move mobs
    for (const id in ENTITIES.MOBS) {
        const mob = ENTITIES.MOBS[id];
        mob.move();
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

        if (playersToSend.length > 0 || mobsToSend.length > 0) {
            // calculate size
            let bufferLength = 2; // type + player count

            for (const player of playersToSend) {
                bufferLength += 1; // id
                bufferLength += 2; // x
                bufferLength += 2; // y
                bufferLength += 2; // angle

                bufferLength += 1; // username length
                bufferLength += (player.username).length;
            }

            bufferLength += 2; // mob count
            bufferLength += mobsToSend.length * 9; // id(2) + x(2) + y(2) + angle(2) + type(1)

            const buffer = new ArrayBuffer(bufferLength);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset++, 2);
            view.setUint8(offset++, playersToSend.length);

            for (const player of playersToSend) {
                const username = player.username;

                view.setUint8(offset++, player.id);
                view.setUint16(offset, player.x); offset += 2;
                view.setUint16(offset, player.y); offset += 2;
                view.setInt16(offset, player.angle); offset += 2;

                view.setUint8(offset++, username.length); // username length
                for (let i = 0; i < username.length; i++) {
                    view.setUint8(offset++, username.charCodeAt(i));
                }
            }

            view.setUint16(offset, mobsToSend.length); offset += 2;
            for (const mob of mobsToSend) {
                view.setUint16(offset, mob.id); offset += 2;
                view.setUint16(offset, mob.x); offset += 2;
                view.setUint16(offset, mob.y); offset += 2;
                view.setInt16(offset, mob.angle); offset += 2;
                view.setUint8(offset++, mob.type);
            }

            ws.send(buffer);
        }
    });
}

setInterval(update, 1000 / 20)