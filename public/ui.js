import { encodeUsername, sendChat } from './helpers.js';
import { ws } from './client.js';

export let isUIOpen = false;
export let isChatOpen = false;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export function initializeUI() {
    // Container
    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '99999'
    });
    document.body.appendChild(container);

    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = '⚙';
    Object.assign(settingsBtn.style, {
        position: 'absolute', top: '10px', right: '10px', pointerEvents: 'auto', cursor: 'pointer'
    });
    container.appendChild(settingsBtn);

    // Settings Modal
    const settingsModal = document.createElement('div');
    Object.assign(settingsModal.style, {
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.8)', padding: '20px', borderRadius: '10px', display: 'none', pointerEvents: 'auto', textAlign: 'center'
    });
    settingsModal.innerHTML = `
        <div style="color:white; font-weight:bold; margin-bottom:10px; font-family:sans-serif;">Set Username</div>
        <input id="u" maxlength="15" placeholder="Username">
        <button id="s">Set</button>
    `;
    container.appendChild(settingsModal);

    // Chat Input
    const chatInput = document.createElement('input');
    Object.assign(chatInput.style, {
        position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
        width: '300px', padding: '10px', borderRadius: '5px', border: '2px solid #333', display: 'none', pointerEvents: 'auto'
    });
    chatInput.maxLength = 50;
    chatInput.placeholder = 'Press Enter to send...';
    container.appendChild(chatInput);

    // Logic
    const uInput = settingsModal.querySelector('#u');
    
    settingsBtn.onclick = () => {
        isUIOpen = !isUIOpen;
        settingsModal.style.display = isUIOpen ? 'block' : 'none';
        if (isUIOpen) {
            uInput.focus();
            isChatOpen = false;
            chatInput.style.display = 'none';
        }
    };

    settingsModal.querySelector('#s').onclick = () => {
        const val = uInput.value.trim();
        if (val) {
            ws.send(encodeUsername(val));
            isUIOpen = false;
            settingsModal.style.display = 'none';
        }
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (isUIOpen) return;
            
            if (isChatOpen) {
                const val = chatInput.value.trim();
                if (val) sendChat(val);
                chatInput.value = '';
                chatInput.style.display = 'none';
                chatInput.blur();
                isChatOpen = false;
                const btn = document.getElementById('mcb');
                if (btn) btn.style.display = 'block';
            } else {
                isChatOpen = true;
                chatInput.style.display = 'block';
                chatInput.focus();
                const btn = document.getElementById('mcb');
                if (btn) btn.style.display = 'none';
            }
        }
    });

    if (isMobile) {
        setupMobileControls(container, chatInput, settingsBtn, settingsModal);
    }
}

function setupMobileControls(container, chatInput, settingsBtn, settingsModal) {
    // Chat Button
    const chatBtn = document.createElement('button');
    chatBtn.id = 'mcb';
    chatBtn.textContent = '💬';
    Object.assign(chatBtn.style, {
        position: 'absolute', bottom: '10px', right: '10px', width: '40px', height: '40px',
        pointerEvents: 'auto', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '20px', cursor: 'pointer'
    });
    chatBtn.onclick = () => {
        if (isChatOpen) return;
        isChatOpen = true;
        chatInput.style.display = 'block';
        chatInput.focus();
        chatBtn.style.display = 'none';
    };
    container.appendChild(chatBtn);

    // Joystick
    const joyContainer = document.createElement('div');
    Object.assign(joyContainer.style, {
        position: 'absolute', bottom: '50px', left: '50px', width: '100px', height: '100px',
        background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', pointerEvents: 'auto', touchAction: 'none'
    });
    const joyKnob = document.createElement('div');
    Object.assign(joyKnob.style, {
        position: 'absolute', top: '50%', left: '50%', width: '40px', height: '40px',
        transform: 'translate(-50%, -50%)', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '50%', pointerEvents: 'none'
    });
    joyContainer.appendChild(joyKnob);
    container.appendChild(joyContainer);

    // Joystick Logic
    let startX, startY;
    let moveId = null;
    const maxDist = 40;
    const activeKeys = { w: 0, a: 0, s: 0, d: 0 };

    const sendKey = (key, state) => {
        const buffer = new ArrayBuffer(3);
        const view = new DataView(buffer);
        view.setUint8(0, 3);
        view.setUint8(1, key);
        view.setUint8(2, state);
        ws.send(buffer);
    };

    const updateKeys = (dx, dy) => {
        const newKeys = { w: 0, a: 0, s: 0, d: 0 };
        if (dy < -10) newKeys.w = 1;
        if (dy > 10) newKeys.s = 1;
        if (dx < -10) newKeys.a = 1;
        if (dx > 10) newKeys.d = 1;

        if (newKeys.w !== activeKeys.w) { sendKey(1, newKeys.w); activeKeys.w = newKeys.w; }
        if (newKeys.a !== activeKeys.a) { sendKey(2, newKeys.a); activeKeys.a = newKeys.a; }
        if (newKeys.s !== activeKeys.s) { sendKey(3, newKeys.s); activeKeys.s = newKeys.s; }
        if (newKeys.d !== activeKeys.d) { sendKey(4, newKeys.d); activeKeys.d = newKeys.d; }
    };

    joyContainer.addEventListener('touchstart', e => {
        if (isUIOpen || isChatOpen) return;
        e.preventDefault();
        const touch = e.changedTouches[0];
        moveId = touch.identifier;
        startX = touch.clientX;
        startY = touch.clientY;
    });

    joyContainer.addEventListener('touchmove', e => {
        if (isUIOpen || isChatOpen) return;
        e.preventDefault();
        let touch;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === moveId) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (!touch) return;

        let dx = touch.clientX - startX;
        let dy = touch.clientY - startY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > maxDist) {
            const ratio = maxDist / dist;
            dx *= ratio;
            dy *= ratio;
        }

        joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + px))`;
        updateKeys(dx, dy);
    });

    const resetJoystick = () => {
        moveId = null;
        joyKnob.style.transform = `translate(-50%, -50%)`;
        updateKeys(0, 0);
    };

    joyContainer.addEventListener('touchend', resetJoystick);
    joyContainer.addEventListener('touchcancel', resetJoystick);

    // Screen Touch Logic
    const sendAttack = (state) => {
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);
        view.setUint8(0, 4);
        view.setUint8(1, state);
        ws.send(buffer);
    };

    const updateRotation = (x, y) => {
        let angle = Math.round(Math.atan2(y - innerHeight / 2, x - innerWidth / 2) * 180 / Math.PI);
        const buffer = new ArrayBuffer(3);
        const view = new DataView(buffer);
        view.setUint8(0, 2);
        view.setInt16(1, angle);
        ws.send(buffer);
        if (window.ENTITIES && window.ENTITIES.PLAYERS[window.myId]) {
            window.ENTITIES.PLAYERS[window.myId].angle = angle;
        }
    };

    window.addEventListener('touchstart', e => {
        if (isUIOpen) return;
        if (e.target === joyContainer || e.target === chatBtn || e.target === settingsBtn || e.target === chatInput || settingsModal.contains(e.target)) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === moveId) continue;
            
            updateRotation(t.clientX, t.clientY);
            if (!isChatOpen) sendAttack(1);
        }
    });

    window.addEventListener('touchmove', e => {
        if (isUIOpen) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === moveId) continue;
            if (e.target === joyContainer) continue;
            
            updateRotation(t.clientX, t.clientY);
        }
    });

    window.addEventListener('touchend', e => {
        let shootingTouchEnded = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier !== moveId) {
                shootingTouchEnded = true;
            }
        }
        if (shootingTouchEnded) sendAttack(0);
    });
}

if (!isMobile) {
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
        if (window.ENTITIES && window.ENTITIES.PLAYERS[window.myId]) {
            window.ENTITIES.PLAYERS[window.myId].angle = angle;
        }
    });

    window.addEventListener("mousedown", e => {
        if (isUIOpen || isChatOpen) return;

        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);

        if (e.button === 0) {
            view.setUint8(0, 4); // 4 for set attack packet
            view.setUint8(1, 1) // 1 for true
        }

        ws.send(buffer);
    });

    window.addEventListener("mouseup", e => {
        if (isUIOpen || isChatOpen) return;

        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);

        if (e.button === 0) {
            view.setUint8(0, 4); // 4 for set attack packet
            view.setUint8(1, 0) // 1 for false
        }
        ws.send(buffer);
    });

    const keys = new Set();
    document.addEventListener('keydown', (e) => {
        if (isUIOpen || isChatOpen) return;
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
        if (!keys.has(e.key.toLowerCase())) return;
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
}
