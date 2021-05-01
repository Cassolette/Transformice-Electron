import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    getTeError: () => {
        return new Promise((resolve, reject) => {
            ipcRenderer.send("send-te-error");
            ipcRenderer.once("send-te-error", (event, errDesc) => {
                resolve(errDesc);
            });
        });
    },
    sendTFMFullscreenMode: (mode: number) => {
        ipcRenderer.send("tfm-fullscreen-mode", mode);
    }
});
