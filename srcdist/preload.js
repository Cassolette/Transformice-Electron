"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electron", {
    getTeError: function () {
        return new Promise(function (resolve, reject) {
            electron_1.ipcRenderer.send("send-te-error");
            electron_1.ipcRenderer.once("send-te-error", function (event, errDesc) {
                resolve(errDesc);
            });
        });
    },
    sendTFMFullscreenMode: function (mode) {
        electron_1.ipcRenderer.send("tfm-fullscreen-mode", mode);
    }
});
