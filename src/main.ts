import { app } from "electron";
import { TeGames } from "./te-enums";
import { WindowTransformice } from "./WindowTransformice";
import { retrieveServer } from "./te-server";
import { WindowDeadMaze } from "./WindowDeadMaze";
import { ArgpObject } from "./argparser";
import * as path from "path";

const BASE_DIR = path.join(__dirname, "..");

/* Fire a combined ready event when both app and server are ready */
module readyHandler {
    var http_ready = false;
    var app_ready = false;
    var http_url: String = null;
    var callback: Function = null;

    function fire() {
        if (http_ready && app_ready && callback)
            callback(http_url);
    }

    export function httpServerReady(hurl: string) {
        http_url = hurl;
        http_ready = true;
        fire();
    }

    export function appReady() {
        app_ready = true;
        fire();
    }

    /**
     * Called after both the app and server are ready.
     */
    export function afterReady(cb: (httpUrl: string) => void) {
        callback = cb;
        fire();
    }
}

/** Adds the flash plugin path to the chromium cmdline */
function addFlashPlugin() {
    let pluginName;
    let iden;
    switch (process.platform) {
        case 'win32':
            iden = "win";
            pluginName = "pepflashplayer64_32_0_0_371.dll";
            break;
        case 'linux':
            iden = "lnx";
            pluginName = "libpepflashplayer64_32_0_0_371.so";
            break;
        case 'darwin':
            iden = "mac";
            pluginName = "PepperFlashPlayer.plugin";
            break;
    }

    console.log(pluginName || "No plugin found.");

    /* Flash plugin can only be loaded when unpacked. */
    app.commandLine.appendSwitch('ppapi-flash-path', path.join(BASE_DIR, "flash-plugin", iden, pluginName)
        .replace('app.asar', 'app.asar.unpacked'));
}

function createWindow(gameType: TeGames, httpUrl: string) {
    switch (gameType) {
        case TeGames.TRANSFORMICE:
            return new WindowTransformice(httpUrl);
        case TeGames.DEADMAZE:
            return new WindowDeadMaze(httpUrl);
        default:
            return new WindowTransformice(httpUrl);
    }
}

/* Start things up */
(async function () {
    var instance_lock = app.requestSingleInstanceLock();
    var argp = new ArgpObject(process.argv);

    addFlashPlugin();
    app.whenReady().then(readyHandler.appReady);
    // First instance: No need to check for existing server URLs
    // Secondary instance: Try to read for any existing server URL stored
    retrieveServer(instance_lock).then(readyHandler.httpServerReady);

    // All ready!
    readyHandler.afterReady((httpUrl) => {
        let gameId: TeGames = TeGames.TRANSFORMICE;

        let id;
        if (id = argp.getFlag("game-id")) {
            id = +id;
            if (Object.values(TeGames).includes(id)) {
                // The ID is valid and exists in the enums
                gameId = id;
            }
        }

        createWindow(gameId, httpUrl).load();
    });
})();
