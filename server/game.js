import {
    Player
} from './player.js'
import {
    Mob
} from './mob.js'
import { Structure } from './structure.js'
import {
    wss
} from '../server.js';

export const ENTITIES = {
    PLAYERS: {},
    MOBS: {},
    STRUCTURES: {},
    playerIds: new Set(),
    newEntity: ({
        type,
        id,
        x,
        y,
    }) => {
        if (type === 'player') {
            type = 1;
            new Player(id, x, y);
            ENTITIES.PLAYERS[id].username = 'player' + id; // Default username
            ENTITIES.playerIds.add(id);
        } else if (type === 'mob') {
            type = 2;
            new Mob(id, x, y, type);
        }

        wss.clients.forEach(client => {
            if (client.id === id && type === 1) {
                client.send(buildInitPacket(client.id));
                return;
            }
            const buffer = new ArrayBuffer(8);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset++, 3); // add packet
            view.setUint8(offset++, type); // entity type
            view.setUint16(offset, id); offset += 2; // entity id
            view.setUint16(offset, x); // x
            offset += 2;
            view.setUint16(offset, y); // y
            offset += 2;
            client.send(buffer);
        });
    },
    deleteEntity: (type, id) => {
        if (type === 'player') {
            type = 1;
            delete ENTITIES.PLAYERS[id];
            ENTITIES.playerIds.delete(id);
        }
        wss.clients.forEach(client => {
            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            let offset = 0;
            view.setUint8(offset++, 4); // delete packet
            view.setUint8(offset++, type); // entity type
            view.setUint16(offset, id); offset += 2; // entity id

            client.send(buffer); // tell this client (loop tells all connected clients)
        })
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
        if (distance > spawnZone.radius + 100) {
            validPosition = true;
        }
    }
    new Structure(i + 2, x, y, 2);
}

export function buildInitPacket(wsId) {
    /*
    sizes
    packet type: 1 byte

    player count: 1 byte
    players: player count * (1 byte for id + 2 bytes for x + 2 bytes for y + 2 bytes for angle + 1 byte for username length + username bytes)
    */
    let bufferLength = 1 + 1; // packet type + player count
    for (const player of Object.values(ENTITIES.PLAYERS)) {
        bufferLength += 1 + 2 + 2 + 2 + 1 + player.username.length; // id, x, y, angle, username length, username
    }
    bufferLength += 2; // mob count
    bufferLength += Object.keys(ENTITIES.MOBS).length * 9; // id(2) + x(2) + y(2) + angle(2) + type(1)

    bufferLength += 2; // structure count
    bufferLength += Object.keys(ENTITIES.STRUCTURES).length * 7; // id(2) + x(2) + y(2) + type(1)

    const buffer = new ArrayBuffer(bufferLength);
    const view = new DataView(buffer);
    let offset = 0;

    view.setUint8(offset++, 1) // 1 for init packet

    // write players to packet
    view.setUint8(offset++, Object.keys(ENTITIES.PLAYERS).length) // number of players
    for (const player of Object.values(ENTITIES.PLAYERS)) {
        view.setUint8(offset++, player.id) // id
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
        view.setUint16(offset, mob.id); offset += 2; // id
        view.setUint16(offset, mob.x); offset += 2; // x
        view.setUint16(offset, mob.y); offset += 2; // y
        view.setInt16(offset, mob.angle); offset += 2; // angle
        view.setUint8(offset++, mob.type); // type
    }

    // write structures to packet
    view.setUint16(offset, Object.keys(ENTITIES.STRUCTURES).length); offset += 2 // number of structures
    for (const structure of Object.values(ENTITIES.STRUCTURES)) {
        view.setUint16(offset, structure.id); offset += 2; // id
        view.setUint16(offset, structure.x); offset += 2; // x
        view.setUint16(offset, structure.y); offset += 2; // y
        view.setUint8(offset++, structure.type); // type
    }

    return buffer;
}