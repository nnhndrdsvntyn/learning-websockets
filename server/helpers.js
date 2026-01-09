import { ENTITIES } from './game.js';

export function validateUsername(username) {
    if (username.length > 15 || username.length === 0) {
        return false;
    } else {
        return true;
    }
}

export function buildPacket(...args) {
    // Calculate total length
    let totalLength = 0;
    for (let i = 0; i < args.length; i += 2) {
        const type = args[i];
        const value = args[i + 1];
        
        if (type === 'u8') totalLength += 1;
        else if (type === 'u16') totalLength += 2;
        else if (type === 'u32') totalLength += 4;
        else if (type === 'f32') totalLength += 4;
        else if (type === 'str') {
            totalLength += 1 + new TextEncoder().encode(value).byteLength;
        }
    }
    
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);
    const uint8Array = new Uint8Array(buffer);
    let offset = 0;
    
    for (let i = 0; i < args.length; i += 2) {
        const type = args[i];
        const value = args[i + 1];
        
        if (type === 'u8') {
            view.setUint8(offset, value);
            offset += 1;
        } else if (type === 'u16') {
            view.setUint16(offset, value, false);
            offset += 2;
        } else if (type === 'u32') {
            view.setUint32(offset, value, false);
            offset += 4;
        } else if (type === 'f32') {
            view.setFloat32(offset, value, false);
            offset += 4;
        } else if (type === 'str') {
            const encoder = new TextEncoder();
            const encoded = encoder.encode(value);
            view.setUint8(offset, encoded.byteLength);
            offset += 1;
            uint8Array.set(encoded, offset);
            offset += encoded.byteLength;
        }
    }
    
    return buffer;
}

class CommandMap {
    constructor() {
        this.entityTypeMap = {
            '1': 'PLAYERS',
            '2': 'MOBS',
        }
    }
    tppos(entityType, entityId, x, y) {
        const entityListName = this.entityTypeMap[entityType];
        if (entityId === 0) // teleport all of that type to the position
        {
            for (const entity of Object.values(ENTITIES[entityListName])) {
                entity.x = x;
                entity.y = y;
            }
        } else if (ENTITIES[entityListName][entityId]) { // teleport specific entity
            ENTITIES[entityListName][entityId].x = x;
            ENTITIES[entityListName][entityId].y = y;
        }
    }
    tpent(entityType, entityId, targetEntityType, targetEntityId) {
        const entityListName = this.entityTypeMap[entityType];
        const targetEntityListName = this.entityTypeMap[targetEntityType];
        if (ENTITIES[entityListName][entityId] && ENTITIES[targetEntityListName][targetEntityId]) {
            ENTITIES[entityListName][entityId].x = ENTITIES[targetEntityListName][targetEntityId].x;
            ENTITIES[entityListName][entityId].y = ENTITIES[targetEntityListName][targetEntityId].y;
        }
    }
    setscore(entityType, entityId, scoreAmount) {
        const entityListName = this.entityTypeMap[entityType];
        if (ENTITIES[entityListName][entityId]) {
            ENTITIES[entityListName][entityId].score = 0
            ENTITIES[entityListName][entityId].addScore(scoreAmount);
        }
    }
}

export const cmdRun = new CommandMap();