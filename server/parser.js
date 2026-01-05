import { ENTITIES } from './game.js';
import { StringDecoder } from 'string_decoder';
import { validateUsername } from './helpers.js';

export function parsePacket(buffer, ws) {
    let offset = 0;

    const packetType = buffer.readUint8(offset++);
    if (packetType === 1) { // type 1 is username packet
        const usernameLength = buffer.readUint8(offset++);
        const potentialUsername = buffer.toString('utf8', offset, offset + usernameLength);
        if (!validateUsername(potentialUsername)) {
            ws.close(); return;
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

    if (packetType === 2) { // type 2 is angle packet
        const angle = buffer.readInt16BE(offset); offset += 2;
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
    if(packetType === 5) { // type 5 is chat message packet
        const messageLength = buffer.readUint8(offset++);
        const chatMessage = buffer.toString('utf8', offset, offset + messageLength);
        ENTITIES.PLAYERS[ws.id].chatMessage = chatMessage;
        return;
    }
}