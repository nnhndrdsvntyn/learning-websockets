import { parsePacket } from './parser.js';
import { LibCanvas } from './libcanvas.js';
import { ENTITIES } from './game.js';
import { entityMap } from './shared/entitymap.js';
window.ENTITIES = ENTITIES;
import { Player } from './player.js';
import { Structure } from './structure.js';
import { Mob } from './mob.js';
import { initializeUI, isUIOpen } from './ui.js';
initializeUI();
import { encodeUsername } from './helpers.js';

export const camera = {
    x: 0,
    y: 0,
    target: {
        x: 0,
        y: 0
    }
}
// window.camera = camera;

export const LC = new LibCanvas();
// window.LC = LC;

// load images
for (const image of Object.values(entityMap.PLAYERS.imgs)) {
    LC.loadImage({
        name: image.name,
        src: image.src
    }); 
}
for (const mob of Object.values(entityMap.MOBS)) {
    LC.loadImage({
        name: mob.imgName,
        src: mob.imgSrc
    });
}
for (const structure of Object.values(entityMap.STRUCTURES)) {
    LC.loadImage({
        name: structure.imgName,
        src: structure.imgSrc
    });
}
for (const projectile of Object.values(entityMap.PROJECTILES)) {
    LC.loadImage({
        name: projectile.imgName,
        src: projectile.imgSrc
    });
}

export const ws = new WebSocket(`ws://${location.host}`);
ws.binaryType = 'arraybuffer'
// window.ws = ws;

export let myId;
ws.onopen = () => {
    console.log('%cConnected to server', 'color: lime; font-weight: bold;');
    setTimeout(() => {
        let username = '';
        while (username.length === 0 || username.length > 15) {
            username = prompt("Enter your username\nMax 15 characeters");
        }

        const buffer = encodeUsername(username);

        ws.send(buffer);
        
        render();
    }, 100)
}
ws.onclose = () => {
    console.log('%cDisconnected from server', 'color: red; font-weight: bold;');
    window.location.reload();
}

ws.onmessage = (event) => {
    if (!myId) {
        myId = parseInt(event.data);
        window.myId = myId;
        new Player(myId, 5000, 5000);
        camera.target.x = ENTITIES.PLAYERS[myId].x;
        camera.target.y = ENTITIES.PLAYERS[myId].y;
        camera.x = camera.target.x - (LC.width / 2);
        camera.y = camera.target.y - (LC.height / 2);

        return;
    }

    parsePacket(event.data);
}

// render loop
function render() {
    LC.clearCanvas();

    LC.drawRect({
        pos: [-5000 - camera.x, -5000 - camera.y],
        size: [10000, 20000],
        color: 'rgba(20, 80, 20, 1)'
    });
    LC.drawRect({
        pos: [5000 - camera.x, -5000 - camera.y],
        size: [10000, 20000],
        color: 'rgba(120, 120, 120, 1)'
    });

    LC.drawRect({
        pos: [0 - camera.x, 0 - camera.y],
        size: [5000, 10000],
        color: 'rgba(34, 139, 34, 1)'
    });
    LC.drawRect({
        pos: [5000 - camera.x, 0 - camera.y],
        size: [5000, 10000],
        color: 'rgba(200, 200, 200, 1)'
    });

    const gridSize = 100; // Size of each grid square
    const startX = -camera.x % gridSize;
    const startY = -camera.y % gridSize;

    LC.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Grid line color
    LC.ctx.lineWidth = 1;

    for (let x = startX; x < LC.width; x += gridSize) {
        LC.ctx.beginPath();
        LC.ctx.moveTo(x, 0);
        LC.ctx.lineTo(x, LC.height);
        LC.ctx.stroke();
    }
    for (let y = startY; y < LC.height; y += gridSize) {
        LC.ctx.beginPath();
        LC.ctx.moveTo(0, y);
        LC.ctx.lineTo(LC.width, y);
        LC.ctx.stroke();
    }
    for (const structure of Object.values(ENTITIES.STRUCTURES)) {
        structure.draw();
    }
    for (const mob of Object.values(ENTITIES.MOBS)) {
        mob.draw();
    }
    for (const projectile of Object.values(ENTITIES.PROJECTILES)) {
        projectile.draw();
    }
    for (const player of Object.values(ENTITIES.PLAYERS)) {
        player.draw();
    }

    // ui
    const localPlayer = ENTITIES.PLAYERS[myId];
    if (localPlayer) {
        const textX = `x: ${localPlayer.x.toFixed(2)}`;
        const textY = `y: ${localPlayer.y.toFixed(2)}`;
        const textScore = `score: ${localPlayer.score}`;

        const metricsX = LC.measureText({ text: textX, font: '20px Arial' });
        const metricsY = LC.measureText({ text: textY, font: '20px Arial' });
        const metricsScore = LC.measureText({ text: textScore, font: '20px Arial' });

        const maxWidth = Math.max(metricsX.width, metricsY.width, metricsScore.width);
        const totalHeight = metricsX.height + metricsY.height + metricsScore.height + 20; // 10px padding between lines and 10px for top/bottom padding

        LC.drawRect({ pos: [5, 5], size: [maxWidth + 20, totalHeight], color: 'rgba(128, 128, 128, 0.5)', cornerRadius: 5 });

        LC.drawText({ text: textX, pos: [15, 25], font: '20px Arial', color: 'white' });
        LC.drawText({ text: textY, pos: [15, 25 + metricsX.height + 5], font: '20px Arial', color: 'white' });
        LC.drawText({ text: textScore, pos: [15, 25 + metricsX.height + 5 + metricsY.height + 5], font: '20px Arial', color: 'white' });
    }
    requestAnimationFrame(render);
}

window.addEventListener("mousemove", e => {
    if (isUIOpen) return;
    let angle = Math.round(
        Math.atan2(
            e.clientY - innerHeight / 2,
            e.clientX - innerWidth / 2
        ) * 180 / Math.PI
    );

    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);

    view.setUint8(0, 2); // 2 for angle packet
    view.setInt16(1, angle);
    ws.send(buffer);

    // set local player's angle directly
    ENTITIES.PLAYERS[myId].angle = angle;
});

window.addEventListener("mousedown", e => {
    if (isUIOpen) return;

    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);

    view.setUint8(0, 4); // 4 for set attack packet
    view.setUint8(1, 1) // 1 for true
    ws.send(buffer);
});

window.addEventListener("mouseup", e => {
    if (isUIOpen) return;

    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);

    view.setUint8(0, 4); // 4 for set attack packet
    view.setUint8(1, 0) // 1 for false
    ws.send(buffer);
});

const keys = new Set();
document.addEventListener('keydown', (e) => {
    if (isUIOpen) return;
    if (!['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(e.key.toLowerCase())) return;
    if (keys.has(e.key.toLowerCase())) return;
    keys.add(e.key.toLowerCase());

    let key;
    const state = 1; // for true
    if (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'arrowup') key = 1;
    if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'arrowleft') key = 2;
    if (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'arrowdown') key = 3;
    if (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'arrowright') key = 4;

    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);

    view.setUint8(0, 3); // input key packet type
    view.setUint8(1, key); // key type
    view.setUint8(2, state); // key state

    ws.send(buffer);
});

document.addEventListener('keyup', (e) => {
    if (!['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(e.key.toLowerCase())) return;
    keys.delete(e.key.toLowerCase());

    let key;
    const state = 0; // for false
    if (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'arrowup') key = 1;
    if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'arrowleft') key = 2;
    if (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'arrowdown') key = 3;
    if (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'arrowright') key = 4;

    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);

    view.setUint8(0, 3); // input key packet type
    view.setUint8(1, key); // key type
    view.setUint8(2, state); // key state

    ws.send(buffer);
});

// update client FPS
import { TPS } from './shared/entitymap.js';
// window.TPS = TPS;
(() => {
    let frames = 0;
    setInterval(() => {
        TPS.client = frames;
        // console.log(TPS.client);
        frames = 0;
    }, 1000);

    function fps() {
        frames++;
        requestAnimationFrame(fps);
    }
    requestAnimationFrame(fps);
})();