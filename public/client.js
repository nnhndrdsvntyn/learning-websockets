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
LC.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
// window.LC = LC;

// load images
for (const image of Object.values(entityMap.PLAYERS.imgs)) {
    LC.loadImage({
        name: image.name,
        src: image.src
    }); 
}
for (const image of Object.values(entityMap.SWORDS.imgs)) {
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
window.ws = ws;

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

    const localPlayer = ENTITIES.PLAYERS[myId];

    // lerp local player's score
    const lerpFactor = (TPS.clientCapped / TPS.server) / 10;
    localPlayer.score += (localPlayer.newScore - localPlayer.score) * ( lerpFactor / 3);
    if (localPlayer.newScore - localPlayer.score < 0.01) {
        localPlayer.score = localPlayer.newScore; // automatically set score to newScore if difference is close enough to new score
    }
    
    // info box (top left of screen)
    if (localPlayer) {
        const textX = `x: ${localPlayer.x.toFixed(2)}`;
        const textY = `y: ${localPlayer.y.toFixed(2)}`;
        const textScore = `score: ${Number(localPlayer.score).toFixed(0)}`;

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

    // level percentage bar
    const percentage = localPlayer.score / entityMap.PLAYERS.levels[localPlayer.level + 1];
    const barWidth = LC.width / 1.15;
    const barHeight = 30;
    LC.drawRect({
        pos: [LC.width / 2 - barWidth / 2, LC.height - barHeight - 30],
        size: [barWidth, barHeight],
        color: 'gray',
        cornerRadius: 5
    });
    LC.drawRect({
        pos: [LC.width / 2 - barWidth / 2, LC.height - barHeight - 30],
        size: [barWidth * percentage, barHeight],
        color: 'cyan',
        cornerRadius: 5
    });
    setTimeout(() => {
        render();
    }, 1000 / TPS.clientCapped)
}

// setings
export const Settings = {
    showIds: false
}
window.Settings = Settings;

// update client FPS
import { TPS } from './shared/entitymap.js';
window.TPS = TPS;
(() => {
    let frames = 0;
    setInterval(() => {
        TPS.clientReal = frames;
        // console.log(TPS.clientReal);
        frames = 0;
    }, 1000);

    function fps() {
        frames++;
        requestAnimationFrame(fps);
    }
    requestAnimationFrame(fps);
})();
