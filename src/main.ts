import { app } from "electron";
import { TeGames } from "./te-enums";
import { WindowTransformice } from "./WindowTransformice";
import { startHttpServer, testHttpServer } from "./te-server";
import { WindowDeadMaze } from "./WindowDeadMaze";
import * as path from "path";
import * as fs from "fs";

const BASE_DIR = path.join(__dirname, "..");
const SERVER_URL_FILE = path.join(app.getPath("userData"), "server.te");

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

async function startServer(instance_lock: Boolean) {
    let stored_url = null;
    if (!instance_lock) {
        // Secondary instance: Try to read for any existing server URL stored
        try {
            let server_url = fs.readFileSync(SERVER_URL_FILE).toString();

            // Test if this server responds
            if (await testHttpServer(server_url)) {
                stored_url = server_url;
            }
        } catch (err) { }
    }

    if (stored_url) {
        readyHandler.httpServerReady(stored_url);
        console.log("Existing local HTTP server @ " + stored_url);
    } else {
        startHttpServer().then((httpUrl) => {
            // Store the current HTTP url
            fs.writeFile(SERVER_URL_FILE, httpUrl, (err) => {
                if (err) {
                    console.error("Failed to save TE server URL.");
                }
            });
            readyHandler.httpServerReady(httpUrl);
            console.log("Set up local HTTP server @ " + httpUrl);
        });
    }
}

/* Start things up */
(async function () {
    var instance_lock = app.requestSingleInstanceLock();

    addFlashPlugin();
    app.whenReady().then(readyHandler.appReady);
    await startServer(instance_lock);

    /* All ready! */
    readyHandler.afterReady((httpUrl) => {
        let gameId: TeGames = TeGames.TRANSFORMICE;

        if (process.argv[2]) {
            let id = +process.argv[2];
            if (Object.values(TeGames).includes(id)) {
                // The ID is valid and exists in the enums
                gameId = id;
            }
        }

        createWindow(gameId, httpUrl).load();
    });

    //console.log(process.argv);
})();
