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
            let bufferLength = 10;
            if (entityType === 2 || entityType === 3) bufferLength += 3; // add 1 spot 'type' and 2 spots for 'angle' if its a projectile / mob
            const buffer = new ArrayBuffer(bufferLength);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset++, 3); // add packet
            view.setUint8(offset++, entityType); // entity type
            view.setUint32(offset, id); offset += 4; // entity id
            view.setUint16(offset, x); // x
            offset += 2;
            view.setUint16(offset, y); // y
            offset += 2;
            if (entityType === 2 || entityType === 3) view.setUint16(offset, angle); offset += 2; // angle allocate mem for mob / projectile angle
            if (entityType === 2 || entityType === 3) view.setUint8(offset++, type); // allocate mem for mob type / projectile type IF it is that type of entity
            client.send(buffer);
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
            const buffer = new ArrayBuffer(1 + 1 + 4);
            const view = new DataView(buffer);
            let offset = 0;
            view.setUint8(offset++, 4); // delete packet
            view.setUint8(offset++, type); // entity type
            view.setUint32(offset, id); offset += 4; // entity id

            client.send(buffer); // tell this client (loop tells all connected clients)
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

export function buildInitPacket(wsId) {
    console.log("Building init packet for", wsId);
    /*
    sizes
    packet type: 1 byte

    player count: 1 byte
    players: player count * (1 byte for id + 2 bytes for x + 2 bytes for y + 2 bytes for angle + 1 byte for username length + username bytes)
    */
    let bufferLength = 1 + 1; // packet type + player count
    for (const player of Object.values(ENTITIES.PLAYERS)) {
        bufferLength += 4 + 2 + 2 + 2 + 1 + player.username.length; // id(4), x(2), y(2), angle(2), username length
    }
    bufferLength += 2; // mob count
    bufferLength += Object.keys(ENTITIES.MOBS).length * 11; // id(4) + x(2) + y(2) + angle(2) + type(1)

    bufferLength += 2; // structure count
    bufferLength += Object.keys(ENTITIES.STRUCTURES).length * 9; // id(4) + x(2) + y(2) + type(1)

    const buffer = new ArrayBuffer(bufferLength);
    const view = new DataView(buffer);
    let offset = 0;

    view.setUint8(offset++, 1) // 1 for init packet

    // write players to packet
    view.setUint8(offset++, Object.keys(ENTITIES.PLAYERS).length) // number of players
    for (const player of Object.values(ENTITIES.PLAYERS)) {
        view.setUint32(offset, player.id); // id
        offset += 4;
        view.setUint16(offset, player.x); // x
        offset += 2;
        view.setUint16(offset, player.y); // y
        offset += 2;
        view.setInt16(offset, player.angle); // angle
        offset += 2;

        // Write username
        view.setUint8(offset++, player.username.length); // username length
        for (let i = 0; i < player.username.length; i++) {
            view.setUint8(offset++, player.username.charCodeAt(i));
        }
    }

    // write mobs
    view.setUint16(offset, Object.keys(ENTITIES.MOBS).length); offset += 2; // number of mobs
    for (const mob of Object.values(ENTITIES.MOBS)) {
        view.setUint32(offset, mob.id); offset += 4; // id
        view.setUint16(offset, mob.x); offset += 2; // x
        view.setUint16(offset, mob.y); offset += 2; // y
        view.setInt16(offset, mob.angle); offset += 2; // angle
        view.setUint8(offset++, mob.type); // type
    }

    // write structures to packet
    view.setUint16(offset, Object.keys(ENTITIES.STRUCTURES).length); offset += 2 // number of structures
    for (const structure of Object.values(ENTITIES.STRUCTURES)) {
        view.setUint32(offset, structure.id); offset += 4; // id
        view.setUint16(offset, structure.x); offset += 2; // x
        view.setUint16(offset, structure.y); offset += 2; // y
        view.setUint8(offset++, structure.type); // type
    }

    return buffer;
}