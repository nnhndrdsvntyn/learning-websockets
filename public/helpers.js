export function encodeUsername(usernameStr) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(usernameStr);
    const buffer = new ArrayBuffer(2 + encoded.byteLength);
    const view = new DataView(buffer);

    let offset = 0;
    view.setUint8(offset++, 1); // packet type
    view.setUint8(offset++, encoded.byteLength);

    new Uint8Array(buffer).set(encoded, offset);

    return buffer;
}

export function sendChat(chatStr) {
    const e = new TextEncoder();
    const b = new ArrayBuffer(2 + chatStr.length);
    const v = new DataView(b);

    let offset = 0;
    const encoded = e.encode(chatStr);
    v.setUint8(offset++, 5);
    v.setUint8(offset++, encoded.byteLength);

    new Uint8Array(b).set(encoded, offset);

    ws.send(b);
}