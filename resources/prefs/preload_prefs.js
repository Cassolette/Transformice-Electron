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
        var cb_error, cb_success;

        ipcRenderer.once("install-flash-error", cb_error = (_, msg) => {
            ipcRenderer.removeListener("install-flash-success", cb_success);
            emitter.emit('error', msg);
        });
        ipcRenderer.once("install-flash-success", cb_success = () => {
            ipcRenderer.removeListener("install-flash-error", cb_error);
            emitter.emit('success');
        });

        ipcRenderer.send("install-flash", version);
        return emitter;
    },
    uninstallFlash: () => {
        var emitter = new EventEmitter();
        var cb_error, cb_success;

        ipcRenderer.once("uninstall-flash-error", cb_error = (_, msg) => {
            ipcRenderer.removeListener("uninstall-flash-success", cb_success);
            emitter.emit('error', msg);
        });
        ipcRenderer.once("uninstall-flash-success", cb_success = () => {
            ipcRenderer.removeListener("uninstall-flash-error", cb_error);
            emitter.emit('success');
        });

        ipcRenderer.send("uninstall-flash");
        return emitter;
    },
    electronSets: electronSets
};
