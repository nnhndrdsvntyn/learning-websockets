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
import { buildPacket } from './server/helpers.js';

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
    // process players
    for (const id in ENTITIES.PLAYERS) {
        const player = ENTITIES.PLAYERS[id];
        player.process();
    }
    // process mobs
    for (const id in ENTITIES.MOBS) {
        const mob = ENTITIES.MOBS[id];
        mob.process();
    }
    // process projectiles
    for (const id in ENTITIES.PROJECTILES) {
        const projectile = ENTITIES.PROJECTILES[id];
        projectile.process();
    }
    // handle structure collisions
    for (const id in ENTITIES.STRUCTURES) {
        const structure = ENTITIES.STRUCTURES[id];
        structure.resolveCollisions();
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
            const args = ['u8', 2];
            
            args.push('u8', playersToSend.length);

            for (const player of playersToSend) {
                args.push(
                    'u32', player.id,
                    'u16', player.x,
                    'u16', player.y,
                    'f32', player.angle,
                    'u16', player.health,
                    'u16', player.maxHealth,
                    'u32', player.score,
                    'u8', player.level,
                    'u8', player.swingState,
                    'u8', player.hasShield,
                    'str', player.username,
                    'str', player.chatMessage,
                );
            }

            args.push('u16', mobsToSend.length);
            for (const mob of mobsToSend) {
                args.push('u32', mob.id, 'u16', mob.x, 'u16', mob.y, 'f32', mob.angle, 'u16', mob.health, 'u16', mob.maxHealth, 'u8', mob.type);
            }

            args.push('u16', projectilesToSend.length);
            for (const projectile of projectilesToSend) {
                args.push('u32', projectile.id, 'u16', projectile.x, 'u16', projectile.y, 'f32', projectile.angle, 'u8', projectile.type);
            }

            ws.send(buildPacket(...args));
        }
    });
}

import { TPS } from './public/shared/entitymap.js';
setInterval(update, 1000 / TPS.server);