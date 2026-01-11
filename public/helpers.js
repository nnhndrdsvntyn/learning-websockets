import { ws } from './client.js';

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
        else if (type === 'u64') totalLength += 8;
        else if (type === 'f64') totalLength += 8;
        else if (type === 'str') {
            totalLength += 1 + new TextEncoder().encode(value).byteLength;
        }
    }
    
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);
    const uint8Array = new Uint8Array(buffer); // Create this once
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
        } else if (type === 'u64') {
            view.setBigUint64(offset, BigInt(value), false);
            offset += 8;
        } else if (type === 'f64') {
            view.setFloat64(offset, value, false);
            offset += 8;
        } else if (type === 'str') {
            const encoder = new TextEncoder();
            const encoded = encoder.encode(value);
            view.setUint8(offset, encoded.byteLength);
            offset += 1;
            uint8Array.set(encoded, offset); // Use the pre-created Uint8Array
            offset += encoded.byteLength;
        }
    }
    
    return buffer;
}

export function encodeUsername(usernameStr) {
    return buildPacket('u8', 1, 'str', usernameStr);
}

export function sendChat(chatStr) {
    ws.send(buildPacket('u8', 5, 'str', chatStr));
}