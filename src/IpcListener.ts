import EventEmitter from "events";
import { ipcMain } from "electron";
import { TeWindow } from "./TeWindow";

var miniListeners: { [wcId: number]: EventEmitter} = {};
var channels: { [channel: string]: {
    listener: (...args: any[]) => void;
    ipcRefs: Map<IpcListener, true>;
} } = {};

/**
 * A simple IPC listener to direct messages to corresponding windows performatically, and destroy
 * listeners automatically at the end of the windows' lifespan.
 */
export class IpcListener {
    window: TeWindow;
    miniListener: EventEmitter;

    constructor(window: TeWindow) {
        this.window = window;
        this.miniListener = new EventEmitter();

        var id = window.browserWindow.webContents.id;
        miniListeners[id] = this.miniListener;

        window.browserWindow.on('closed', () => {
            this.removeAllListeners();
            delete miniListeners[id];
        });
    }

    on(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): this {
        this.miniListener.on(channel, listener);

        if (!channels[channel]) {
            var ipc_listen: (...args: any[]) => void;
            ipcMain.on(channel, ipc_listen = (event, ...args) => {
                if (!miniListeners[event.sender.id]) return;
                miniListeners[event.sender.id].emit(channel, event, ...args);
            });
            channels[channel] = { listener: ipc_listen, ipcRefs: new Map()};
        }

        channels[channel].ipcRefs.set(this, true)

        return this;
    }

    off(channel: string, listener: (...args: any[]) => void): this {
        if (!channels[channel]) return this;

        this.miniListener.off(channel, listener);
        if (this.miniListener.listenerCount(channel) <= 0) {
            channels[channel].ipcRefs.delete(this);
            if (channels[channel].ipcRefs.size <= 0) {
                ipcMain.off(channel, channels[channel].listener);
                delete channels[channel];
            }
        }

        return this;
    }

    removeAllListeners(channel?: string): this {
        this.miniListener.removeAllListeners(channel);

        var del = (channel: string) => {
            channels[channel].ipcRefs.delete(this);
            if (channels[channel].ipcRefs.size <= 0) {
                ipcMain.off(channel, channels[channel].listener);
                delete channels[channel];
            }
        }

        if (channel) {
            if (channels[channel]) {
                del(channel);
            }
        } else {
            for (let c in channels) {
                del(c);
            }
        }

        return this;
    }
}
