import { ENTITIES } from './game.js';

export function parsePacket(buffer, wsId) {
    let offset = 0;

    const packetType = buffer.readUint8(offset++);
    if (packetType === 1) { // type 1 is username packet
        const usernameLength = buffer.readUint8(offset++);
        if (usernameLength > 15) return; // username too long
        if (usernameLength === 0) { ENTITIES.PLAYERS[wsId].username = `player${wsId}`; return; } // set default username if length is 0
        let username = '';
        for (let i = 0; i < usernameLength; i++) {
            username += String.fromCharCode(buffer.readUint8(offset++));
        }
        ENTITIES.PLAYERS[wsId].username = username;
        return;
    }
    if (packetType === 2) { // type 2 is angle packet
        const angle = buffer.readInt16BE(offset); offset += 2;
        ENTITIES.PLAYERS[wsId].angle = angle;
        return;
    }
    if (packetType === 3) { // type 3 is move packet
        const key = buffer.readUint8(offset++);
        const state = buffer.readUint8(offset++);

        if (key === 1) ENTITIES.PLAYERS[wsId].keys.w = state; // 0 or 1
        if (key === 2) ENTITIES.PLAYERS[wsId].keys.a = state; // 0 or 1
        if (key === 3) ENTITIES.PLAYERS[wsId].keys.s = state; // 0 or 1
        if (key === 4) ENTITIES.PLAYERS[wsId].keys.d = state; // 0 or 1
        return;
    }
}