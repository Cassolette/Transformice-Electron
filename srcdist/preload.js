"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electron", {
    getTeError: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.send("send-te-error");
            electron_1.ipcRenderer.once("send-te-error", (event, errDesc) => {
                resolve(errDesc);
            });
        });
    },
    sendTFMFullscreenMode: (mode) => {
        electron_1.ipcRenderer.send("tfm-fullscreen-mode", mode);
    }
});
