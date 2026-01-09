import {
    Player
} from './player.js';
import {
    Mob
} from './mob.js';
import { Structure } from './structure.js';
import { Projectile } from './projectile.js';
import {
    wss
} from '../server.js';
import { buildPacket } from './helpers.js';

export const ENTITIES = {
    PLAYERS: {},
    MOBS: {},
    STRUCTURES: {},
    PROJECTILES: {},
    playerIds: new Set(),
    newEntity: ({
        entityType,
        id,
        x,
        y,
        angle,
        type,
        shooter,
        username,
    }) => {
        if (entityType === 'player') {
            entityType = 1;
            new Player(id, x, y);
            ENTITIES.PLAYERS[id].username = username || ('player' + id); // Default username
            ENTITIES.playerIds.add(id);
        } else if (entityType === 'projectile') {
            entityType = 2;
            new Projectile(id, x, y, angle, type, shooter);
        } else if (entityType === 'mob') {
            entityType = 3;
            new Mob(id, x, y, type);
        }

        wss.clients.forEach(client => {
            if (client.id === id && entityType === 1) {
                client.send(buildInitPacket(client.id));
                return;
            }
            
            if (entityType === 2 || entityType === 3) {
                client.send(buildPacket('u8', 3, 'u8', entityType, 'u32', id, 'u16', x, 'u16', y, 'f32', angle, 'u8', type));
            } else {
                client.send(buildPacket('u8', 3, 'u8', entityType, 'u32', id, 'u16', x, 'u16', y));
            }
        });
    },
    deleteEntity: (type, id) => {
        if (type === 'player') {
            type = 1;
            delete ENTITIES.PLAYERS[id];
            ENTITIES.playerIds.delete(id);
        }

        if (type === 'projectile') {
            type = 2;
            delete ENTITIES.PROJECTILES[id];
        }

        if (type === 'mob') {
            type = 3;
            delete ENTITIES.MOBS[id];
        }
        wss.clients.forEach(client => {
            client.send(buildPacket('u8', 4, 'u8', type, 'u32', id));
        });
    }
}

// create some structures
new Structure(1, 5000, 5000, 1); // spawn zone

// rock structures (make sure to not spawn within spawnzoneradius + 100 distance from a spawn zon)
for (let i = 0; i < 100; i++) {
    let x, y;
    let validPosition = false;
    while (!validPosition) {
        x = Math.floor(Math.random() * 10000);
        y = Math.floor(Math.random() * 10000);
        const spawnZone = ENTITIES.STRUCTURES[1]; // Assuming spawn zone is structure with id 1
        const distance = Math.sqrt(Math.pow(x - spawnZone.x, 2) + Math.pow(y - spawnZone.y, 2));
        // Ensure not near spawn zone and not near map edges (10000x10000 map)
        if (distance > spawnZone.radius + 100 &&
            x > 500 && x < 9500 &&
            y > 500 && y < 9500) {
            validPosition = true;
        }
    }
    new Structure(i + 2, x, y, 2);
}

// bush structures (make sure to not spawn within spawnzoneradius + 100 distance from a spawn zone AND rock)
for (let i = 0; i < 100; i++) {
    let x, y;
    let validPosition = false;
    while (!validPosition) {
        x = Math.floor(Math.random() * 10000);
        y = Math.floor(Math.random() * 10000);
        const spawnZone = ENTITIES.STRUCTURES[1]; // Assuming spawn zone is structure with id 1
        const distance = Math.sqrt(Math.pow(x - spawnZone.x, 2) + Math.pow(y - spawnZone.y, 2));
        // Ensure not near spawn zone and not near map edges (10000x10000 map)
        if (distance > spawnZone.radius + 100 &&
            x > 500 && x < 9500 &&
            y > 500 && y < 9500) {
            validPosition = true;
        }
    }
    new Structure(i + 3, x, y, 3);
}

export function buildInitPacket(wsId) {
    console.log("Building init packet for", wsId);
    const args = ['u8', 1];
    
    const players = Object.values(ENTITIES.PLAYERS);
    args.push('u8', players.length);
    for (const player of players) {
        args.push('u32', player.id, 'u16', player.x, 'u16', player.y, 'f32', player.angle, 'str', player.username);
    }

    const mobs = Object.values(ENTITIES.MOBS);
    args.push('u16', mobs.length);
    for (const mob of mobs) {
        args.push('u32', mob.id, 'u16', mob.x, 'u16', mob.y, 'f32', mob.angle, 'u8', mob.type);
    }

    const structures = Object.values(ENTITIES.STRUCTURES);
    args.push('u16', structures.length);
    for (const structure of structures) {
        args.push('u32', structure.id, 'u16', structure.x, 'u16', structure.y, 'u8', structure.type);
    }

    return buildPacket(...args);
}