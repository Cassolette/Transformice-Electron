"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpcListener = void 0;
const events_1 = __importDefault(require("events"));
const electron_1 = require("electron");
var miniListeners = {};
var channels = {};
class IpcListener {
    constructor(window) {
        this.window = window;
        this.miniListener = new events_1.default();
        var id = window.browserWindow.webContents.id;
        miniListeners[id] = this.miniListener;
        window.browserWindow.on('closed', () => {
            this.removeAllListeners();
            miniListeners[id] = null;
        });
    }
    on(channel, listener) {
        this.miniListener.on(channel, listener);
        if (!channels[channel]) {
            var ipc_listen;
            electron_1.ipcMain.on(channel, ipc_listen = (event, ...args) => {
                if (!miniListeners[event.sender.id])
                    return;
                miniListeners[event.sender.id].emit(channel, event, ...args);
            });
            channels[channel] = { listener: ipc_listen, ipcRefs: new Map() };
        }
        channels[channel].ipcRefs.set(this, true);
        return this;
    }
    off(channel, listener) {
        if (!channels[channel])
            return this;
        this.miniListener.off(channel, listener);
        if (this.miniListener.listenerCount(channel) <= 0) {
            channels[channel].ipcRefs.delete(this);
            if (channels[channel].ipcRefs.size <= 0) {
                electron_1.ipcMain.off(channel, channels[channel].listener);
                channels[channel] = null;
            }
        }
        return this;
    }
    removeAllListeners(channel) {
        this.miniListener.removeAllListeners(channel);
        var del = (channel) => {
            channels[channel].ipcRefs.delete(this);
            if (channels[channel].ipcRefs.size <= 0) {
                electron_1.ipcMain.off(channel, channels[channel].listener);
                channels[channel] = null;
            }
        };
        if (channel) {
            if (channels[channel]) {
                del(channel);
            }
        }
        else {
            for (let c in channels) {
                del(c);
            }
        }
        return this;
    }
}
exports.IpcListener = IpcListener;
