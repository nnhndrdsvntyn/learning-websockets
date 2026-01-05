import { ENTITIES } from './game.js';
import { Player } from './player.js';
import { Mob } from './mob.js';
import { Projectile } from './projectile.js';
import { Structure } from './structure.js';

export function parsePacket(buffer) {
    const view = new DataView(buffer);
    let offset = 0;

    const type = view.getUint8(offset++);
    if (type === 1) { // init packet
        // init players
        const playerCount = view.getUint8(offset++);
        for (let i = 0; i < playerCount; i++) {
            // read data
            const id = view.getUint32(offset); offset += 4;
            const x = view.getUint16(offset); offset += 2;
            const y = view.getUint16(offset); offset += 2;
            const angle = view.getInt16(offset); offset += 2;

            const usernameLength = view.getUint8(offset++);
            const username = new TextDecoder().decode(new Uint8Array(view.buffer, offset, usernameLength));
            offset += usernameLength;

            // set data
            const player = new Player(id, x, y);
            player.angle = angle;
            player.username = username;
        }

        // init mobs
        const mobCount = view.getUint16(offset); offset += 2;
        for (let i = 0; i < mobCount; i++) {
            // read data
            const id = view.getUint32(offset); offset += 4;
            const x = view.getUint16(offset); offset += 2;
            const y = view.getUint16(offset); offset += 2;
            const angle = view.getInt16(offset); offset += 2;
            const type = view.getUint8(offset++);

            // set data
            const mob = new Mob(id, x, y, type);
            mob.angle = angle;
        }

        // init structures
        const structureCount = view.getUint16(offset); offset += 2;
        for (let i = 0; i < structureCount; i++) {
            const id = view.getUint32(offset); offset += 4;
            const x = view.getUint16(offset); offset += 2;
            const y = view.getUint16(offset); offset += 2;
            const type = view.getUint8(offset++);

            new Structure(id, x, y, type);
        }
    } else if (type === 2) { // update packet
        // update players
        const playerCount = view.getUint8(offset++);
        const playerIdsThisUpdate = [];
        for (let i = 0; i < playerCount; i++) {
            // read data
            const id = view.getUint32(offset); offset += 4;
            playerIdsThisUpdate.push(id);

            const x = view.getUint16(offset); offset += 2;
            const y = view.getUint16(offset); offset += 2;
            const angle = view.getInt16(offset); offset += 2;
            const health = view.getUint16(offset); offset += 2;
            const maxHealth = view.getUint16(offset); offset += 2;
            const score = view.getUint32(offset); offset += 4;
            const level = view.getUint8(offset++);

            const usernameLength = view.getUint8(offset++);
            const username = new TextDecoder().decode(new Uint8Array(view.buffer, offset, usernameLength));
            offset += usernameLength;

            const chatMessageLength = view.getUint8(offset++);
            const chatMessage = new TextDecoder().decode(new Uint8Array(view.buffer, offset, chatMessageLength));
            offset += chatMessageLength;

            // set data
            if (!ENTITIES.PLAYERS[id]) { // make player if it doesn't exist
                new Player(id, x, y)
            }

            // set their data
            ENTITIES.PLAYERS[id].newX = x;
            ENTITIES.PLAYERS[id].newY = y;
            ENTITIES.PLAYERS[id].health = health;
            ENTITIES.PLAYERS[id].maxHealth = maxHealth;
            ENTITIES.PLAYERS[id].newAngle = angle;
            ENTITIES.PLAYERS[id].newScore = score;
            ENTITIES.PLAYERS[id].level = level;
            ENTITIES.PLAYERS[id].username = username;
            ENTITIES.PLAYERS[id].chatMessage = chatMessage;
        }

        // all players that aren't in this update will have their x and y set to undefined, because they are out of range.
        for (const player of Object.values(ENTITIES.PLAYERS)) {
            if (!playerIdsThisUpdate.includes(player.id)) {
                player.x = undefined;
                player.newX = undefined;
                player.y = undefined;
                player.newY = undefined;
            }
        }

        // update mobs
        const mobCount = view.getUint16(offset); offset += 2;
        const mobIdsThisUpdate = [];
        for (let i = 0; i < mobCount; i++) {
            const id = view.getUint32(offset); offset += 4;
            mobIdsThisUpdate.push(id);

            const x = view.getUint16(offset); offset += 2;
            const y = view.getUint16(offset); offset += 2;
            const angle = view.getInt16(offset); offset += 2;
            const health = view.getUint16(offset); offset += 2;
            const maxHealth = view.getUint16(offset); offset += 2;
            const type = view.getUint8(offset++);

            if (!ENTITIES.MOBS[id]) {
                new Mob(id, x, y, type);
            }

            const mob = ENTITIES.MOBS[id];
            mob.newX = x;
            mob.newY = y;
            mob.newAngle = angle;
            mob.health = health;
            mob.maxHealth = maxHealth;
        }

        for (const mob of Object.values(ENTITIES.MOBS)) {
            if (!mobIdsThisUpdate.includes(mob.id)) {
                mob.x = undefined;
                mob.newX = undefined;
                mob.y = undefined;
                mob.newY = undefined;
            }
        }

        // update projectiles
        const projectileCount = view.getUint16(offset); offset += 2;
        const projectileIdsThisUpdate = [];
        for (let i = 0; i < projectileCount; i++) {
            const id = view.getUint32(offset); offset += 4;
            projectileIdsThisUpdate.push(id);

            const x = view.getUint16(offset); offset += 2;
            const y = view.getUint16(offset); offset += 2;
            const angle = view.getInt16(offset); offset += 2;
            const type = view.getUint8(offset++);

            if (!ENTITIES.PROJECTILES[id]) {
                new Projectile(id, x, y, angle, type);
            }

            const projectile = ENTITIES.PROJECTILES[id];
            projectile.newX = x;
            projectile.newY = y;
            projectile.newAngle = angle;
        }
    } else if (type === 3) { // add packet
        // make new entity based on entity type
        const entityType = view.getUint8(offset++); // entity type to add
        const entityId = view.getUint32(offset); offset += 4; // entity id to add
        const x = view.getUint16(offset); offset += 2; // x
        const y = view.getUint16(offset); offset += 2; // y
        const angle = view.getInt16(offset); offset += 2; // angle
        if (entityType === 1) {
            new Player(entityId, x, y);
        } else if (entityType === 2) {
            const type = view.getUint8(offset++); // projectile type
            new Projectile(entityId, x, y, angle, type);
        } else if (entityType === 3) { // if its a mob, then look for the type attribute packet.
            const type = view.getUint8(offset++); // mob type
            new Mob(entityId, x, y, type);
        }

        // console.log("add", entityType, entityId);
    } else if (type === 4) { // delete packet
        const entityType = view.getUint8(offset++); // entity type to delete
        const entityId = view.getUint32(offset); offset += 4; // entity id to delete
        
        if (entityType === 1) {
            delete ENTITIES.PLAYERS[entityId];
        } else if (entityType === 2) {
            delete ENTITIES.PROJECTILES[entityId];
        } else if (entityType === 3) {
            delete ENTITIES.MOBS[entityId];
        }

        // console.log("delete", entityType, entityId);
    }
}