import { encodeUsername, sendChat } from './helpers.js';
import { ws } from './client.js';

export let isUIOpen = false;
export let isChatOpen = false;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function createEl(tag, styles = {}, parent = null, props = {}) {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    Object.assign(el, props);
    if (parent) parent.appendChild(el);
    return el;
}

export function initializeUI() {
    // Container
    const container = createEl('div', {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '99999'
    }, document.body);

    // Settings Button
    const settingsBtn = createEl('button', {
        position: 'absolute', top: '10px', right: '10px', pointerEvents: 'auto', cursor: 'pointer'
    }, container, { textContent: '⚙' });

    // Settings Modal
    const settingsModal = createEl('div', {
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.8)', padding: '20px', borderRadius: '10px', display: 'none', pointerEvents: 'auto', textAlign: 'center'
    }, container, {
        innerHTML: `
        <div style="color:white; font-weight:bold; margin-bottom:10px; font-family:sans-serif;">Set Username</div>
        <input id="u" maxlength="15" placeholder="Username">
        <button id="s">Set</button>
    `});

    // Chat Input
    const chatInput = createEl('input', {
        position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
        width: '300px', padding: '10px', borderRadius: '5px', border: '2px solid #333', display: 'none', pointerEvents: 'auto'
    }, container, { maxLength: 50, placeholder: 'Press Enter to send...' });

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
    } else {
        setupDesktopControls();
    }
}

function setupMobileControls(container, chatInput, settingsBtn, settingsModal) {
    // Chat Button
    const chatBtn = createEl('button', {
        position: 'absolute', bottom: '10px', right: '10px', width: '40px', height: '40px',
        pointerEvents: 'auto', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '20px', cursor: 'pointer'
    }, container, { id: 'mcb', textContent: '💬' });

    chatBtn.onclick = () => {
        if (isChatOpen) return;
        isChatOpen = true;
        chatInput.style.display = 'block';
        chatInput.focus();
        chatBtn.style.display = 'none';
    };

    // Joystick
    const joyContainer = createEl('div', {
        position: 'absolute', bottom: '50px', left: '50px', width: '100px', height: '100px',
        background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', pointerEvents: 'auto', touchAction: 'none'
    }, container);

    const joyKnob = createEl('div', {
        position: 'absolute', top: '50%', left: '50%', width: '40px', height: '40px',
        transform: 'translate(-50%, -50%)', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '50%', pointerEvents: 'none'
    }, joyContainer);

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

        joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
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
        if (window.ENTITIES?.PLAYERS?.[window.myId]) {
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

function setupDesktopControls() {
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
        if (window.ENTITIES?.PLAYERS?.[window.myId]) {
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
    const keyMap = {
        'w': 1, 'arrowup': 1,
        'a': 2, 'arrowleft': 2,
        's': 3, 'arrowdown': 3,
        'd': 4, 'arrowright': 4
    };

    const handleKey = (e, isDown) => {
        if (isUIOpen || isChatOpen) return;
        const keyName = e.key.toLowerCase();
        if (!keyMap[keyName]) return;

        if (isDown) {
            if (keys.has(keyName)) return;
            keys.add(keyName);
        } else {
            if (!keys.has(keyName)) return;
            keys.delete(keyName);
        }

        const key = keyMap[keyName];
        const state = isDown ? 1 : 0;

        const buffer = new ArrayBuffer(3);
        const view = new DataView(buffer);

        view.setUint8(0, 3); // input key packet type
        view.setUint8(1, key); // key type
        view.setUint8(2, state); // key state

        ws.send(buffer);
    };

    document.addEventListener('keydown', (e) => handleKey(e, true));
    document.addEventListener('keyup', (e) => handleKey(e, false));
}
