import { encodeUsername, sendChat, buildPacket } from './helpers.js';
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
        <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:10px; display:inline-block;">
            <input id="u" maxlength="15" placeholder="Username" style="width:200px;">
            <button id="s" style="margin-left:8px">Set</button>
        </div>
        <div>
            <button id="fullscreenToggle" style="margin-top:4px">Enter Fullscreen</button>
        </div>
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

    // Fullscreen toggle logic for settings
    const fsBtn = settingsModal.querySelector('#fullscreenToggle');
    if (fsBtn) {
        const updateFSBtnText = () => {
            const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
            fsBtn.textContent = isFS ? 'Exit Fullscreen' : 'Enter Fullscreen';
        };

        fsBtn.onclick = async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen?.();
                } else {
                    await document.exitFullscreen?.();
                }
            } catch (err) {
                // ignore errors silently
            }
            // update text after state change
            setTimeout(updateFSBtnText, 100);
        };

        // Keep button text in sync when full screen changes outside modal
        document.addEventListener('fullscreenchange', updateFSBtnText);
        updateFSBtnText();
    }

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
        ws.send(buildPacket('u8', 3, 'u8', key, 'u8', state));
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
        ws.send(buildPacket('u8', 4, 'u8', state));
    };

    const updateRotation = (x, y) => {
        let angle = Math.atan2(y - innerHeight / 2, x - innerWidth / 2);
        ws.send(buildPacket('u8', 2, 'f32', angle));
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
        let angle =
            Math.atan2(e.clientY - innerHeight / 2, e.clientX - innerWidth / 2);

        ws.send(buildPacket('u8', 2, 'f32', angle));

        // set local player's angle directly
        if (window.ENTITIES?.PLAYERS?.[window.myId] && window.ENTITIES?.PLAYERS?.[window.myId].swingState === 0) {
            window.ENTITIES.PLAYERS[window.myId].angle = angle;
        }
    });

    window.addEventListener("mousedown", e => {
        if (isUIOpen || isChatOpen) return;

        if (e.button === 0) {
            ws.send(buildPacket('u8', 4, 'u8', 1));
        }
    });

    window.addEventListener("mouseup", e => {
        if (isUIOpen || isChatOpen) return;

        if (e.button === 0) {
            ws.send(buildPacket('u8', 4, 'u8', 0));
        }
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

        ws.send(buildPacket('u8', 3, 'u8', key, 'u8', state));
    };

    document.addEventListener('keydown', (e) => handleKey(e, true));
    document.addEventListener('keyup', (e) => handleKey(e, false));
}
