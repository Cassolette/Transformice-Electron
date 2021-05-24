const { ipcRenderer } = require("electron");
const electronSets = require("electron-settings");
const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");

window.electron = {
    readFile: (filename, cb) => {
        return fs.readFile(path.join(__dirname, filename), cb);
    },
    getFlashReleases: () => {
        return new Promise((resolve, reject) => {
            ipcRenderer.send("flash-release");
            ipcRenderer.once("flash-release", (_, obj) => {
                resolve(obj);
            });
        });
    },
    installFlash: (version) => {
        var emitter = new EventEmitter();
        ipcRenderer.send("install-flash", version);
        var on_progress = (_, prog) => {
            emitter.emit('progress', prog);
        };
        ipcRenderer.on("install-flash-progress", on_progress);
        ipcRenderer.once("install-flash-error", (_, msg) => {
            ipcRenderer.removeListener("install-flash-progress", on_progress);
            emitter.emit('error', msg);
        });
        ipcRenderer.once("install-flash-success", () => {
            ipcRenderer.removeListener("install-flash-progress", on_progress);
            emitter.emit('success');
        });
        return emitter;
    },
    uninstallFlash: () => {
        var emitter = new EventEmitter();
        ipcRenderer.send("uninstall-flash");
        ipcRenderer.once("uninstall-flash-error", (_, msg) => {
            emitter.emit('error', msg);
        });
        ipcRenderer.once("uninstall-flash-success", () => {
            emitter.emit('success');
        });
        return emitter;
    },
    electronSets: electronSets
};
