export function encodeUsername(usernameStr) {
    const buffer = new ArrayBuffer(2 + usernameStr.length);
    const view = new DataView(buffer);

    let offset = 0;
    view.setUint8(offset++, 1); // packet type
    view.setUint8(offset++, usernameStr.length);

    for (let i = 0; i < usernameStr.length; i++) {
        view.setUint8(offset++, usernameStr.charCodeAt(i));
    }

    return buffer;
}