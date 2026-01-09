import {
    ENTITIES
} from './game.js';
import {
    StringDecoder
} from 'string_decoder';
import {
    validateUsername, cmdRun
} from './helpers.js';
import { wss } from '../server.js';

export function parsePacket(buffer, ws) {
    let offset = 0;

    const packetType = buffer.readUint8(offset++);
    if (packetType === 1) { // type 1 is username packet
        const usernameLength = buffer.readUint8(offset++);
        const potentialUsername = buffer.toString('utf8', offset, offset + usernameLength);
        if (!validateUsername(potentialUsername)) {
            ws.close();
            return;
        }

        let username = '';
        if (usernameLength === 0) {
            username = `player${ws.id}`;
        } else {
            username = buffer.toString('utf8', offset, offset + usernameLength);
        }

        if (!ENTITIES.PLAYERS[ws.id]) {
            ENTITIES.newEntity({
                entityType: 'player',
                id: ws.id,
                x: 5000,
                y: 5000,
                username: username
            });
        } else {
            ENTITIES.PLAYERS[ws.id].username = username;
        }
        return;
    }

    if (!ENTITIES.PLAYERS[ws.id]) return;   

    if (packetType === 2) { // angle packet
        if (ENTITIES.PLAYERS[ws.id].swingState != 0) return;
        
        const view = new DataView(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength
        );

        const angle = view.getFloat32(1, false); // offset = 1, big-endian
        ENTITIES.PLAYERS[ws.id].angle = angle;
        return;
    }
    if (packetType === 3) { // type 3 is move packet
        const key = buffer.readUint8(offset++);
        const state = buffer.readUint8(offset++);

        if (key === 1) ENTITIES.PLAYERS[ws.id].keys.w = state; // 0 or 1
        if (key === 2) ENTITIES.PLAYERS[ws.id].keys.a = state; // 0 or 1
        if (key === 3) ENTITIES.PLAYERS[ws.id].keys.s = state; // 0 or 1
        if (key === 4) ENTITIES.PLAYERS[ws.id].keys.d = state; // 0 or 1
        return;
    }
    if (packetType === 4) { // type 4 is attack packet
        const state = buffer.readUint8(offset++);
        ENTITIES.PLAYERS[ws.id].attacking = state; // 1 or 0
        return;
    }
    if (packetType === 5) { // type 5 is chat message packet
        const messageLength = buffer.readUint8(offset++);
        const chatMessage = buffer.toString('utf8', offset, offset + messageLength);
        ENTITIES.PLAYERS[ws.id].chatMessage = chatMessage;
        ENTITIES.PLAYERS[ws.id].lastChatTime = performance.now();
        return;
    }
    if (packetType === 6) { // type 6 is command packet
        const adminPassword = 'admin123'; // Example admin password
        const cmdType = buffer.readUint8(offset++);
        if (cmdType === 1) { // tp pos to entity packet
            const entityType = buffer.readUint8(offset++);
            const entityId = buffer.readUInt32BE(offset); offset += 4;
            const x = buffer.readUint16BE(offset);
            offset += 2;
            const y = buffer.readUint16BE(offset);
            offset += 2;
            cmdRun.tppos(entityType, entityId, x, y);
        } else if (cmdType === 2) { // tp entity to entity packet
            const entityType = buffer.readUint8(offset++);
            const entityId = buffer.readUInt32BE(offset); offset += 4;
            const targetEntityType = buffer.readUint8(offset++);
            const targetEntityId = buffer.readUInt32BE(offset); offset += 4;
            cmdRun.tpent(entityType, entityId, targetEntityType, targetEntityId);
        } else if (cmdType === 3) { // kick player packet
            const entityId = buffer.readUInt32BE(offset); offset += 4;
            wss.clients.forEach(client => {
                if (client.id === entityId) {
                    client.close();
                    delete ENTITIES.PLAYERS[entityId];
                }
            }); 
        } else if (cmdType === 4) { // set xp of an entity
            const entityType = buffer.readUint8(offset++);
            const entityId = buffer.readUInt32BE(offset); offset += 4;
            const scoreAmount = buffer.readUint32BE(offset); offset += 4;
            cmdRun.setscore(entityType, entityId, scoreAmount);
        }
    }
}