import { encodeUsername } from './helpers.js';
import { ws } from './client.js';

export let isUIOpen = false;

export function initializeUI() {
    (() => {
        let last = "";

        const btn = document.createElement("button");
        btn.textContent = "⚙";
        Object.assign(btn.style, {
            position: "fixed",
            top: "10px",
            right: "10px",
            zIndex: 99999
        });

        const ui = document.createElement("div");
        Object.assign(ui.style, {
            position: "fixed",
            inset: "0",
            display: "none",
            placeItems: "center",
            background: "rgba(0,0,0,.5)",
            zIndex: 99998
        });

        const box = document.createElement("div");
        box.innerHTML = `
    <div style="color:white; font-family: sans-serif; font-weight: bold; margin-bottom: 8px;">Set Username</div>
    <input id="u" placeholder="username" maxlength="15">
    <button id="c" disabled>set</button>
  `;
        box.style.background = "#222";
        box.style.padding = "12px";

        ui.appendChild(box);
        document.body.append(btn, ui);

        const input = box.querySelector("#u");
        const check = box.querySelector("#c");

        btn.onclick = () => {
            ui.style.display = ui.style.display === "grid" ? "none" : "grid";
            isUIOpen = ui.style.display === "grid";
            input.value = last;
            validate();
        };

        function validate() {
            const v = input.value.trim();
            check.disabled = !v || v === last;
        }

        input.oninput = validate;

        check.onclick = () => {
            last = input.value.trim();
            ws.send(encodeUsername(last));
            validate();
        };
    })();
}