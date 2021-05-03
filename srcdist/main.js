"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const te_enums_1 = require("./te-enums");
const WindowTransformice_1 = require("./WindowTransformice");
const te_server_1 = require("./te-server");
const WindowDeadMaze_1 = require("./WindowDeadMaze");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const BASE_DIR = path.join(__dirname, "..");
const SERVER_URL_FILE = path.join(electron_1.app.getPath("userData"), "server.te");
/* Fire a combined ready event when both app and server are ready */
var readyHandler;
(function (readyHandler) {
    var http_ready = false;
    var app_ready = false;
    var http_url = null;
    var callback = null;
    function fire() {
        if (http_ready && app_ready && callback)
            callback(http_url);
    }
    function httpServerReady(hurl) {
        http_url = hurl;
        http_ready = true;
        fire();
    }
    readyHandler.httpServerReady = httpServerReady;
    function appReady() {
        app_ready = true;
        fire();
    }
    readyHandler.appReady = appReady;
    /**
     * Called after both the app and server are ready.
     */
    function afterReady(cb) {
        callback = cb;
        fire();
    }
    readyHandler.afterReady = afterReady;
})(readyHandler || (readyHandler = {}));
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
    electron_1.app.commandLine.appendSwitch('ppapi-flash-path', path.join(BASE_DIR, "flash-plugin", iden, pluginName)
        .replace('app.asar', 'app.asar.unpacked'));
}
function createWindow(gameType, httpUrl) {
    switch (gameType) {
        case te_enums_1.TeGames.TRANSFORMICE:
            return new WindowTransformice_1.WindowTransformice(httpUrl);
        case te_enums_1.TeGames.DEADMAZE:
            return new WindowDeadMaze_1.WindowDeadMaze(httpUrl);
        default:
            return new WindowTransformice_1.WindowTransformice(httpUrl);
    }
}
async function startServer(instance_lock) {
    let stored_url = null;
    if (!instance_lock) {
        // Secondary instance: Try to read for any existing server URL stored
        try {
            let server_url = fs.readFileSync(SERVER_URL_FILE).toString();
            // Test if this server responds
            if (await te_server_1.testHttpServer(server_url)) {
                stored_url = server_url;
            }
        }
        catch (err) { }
    }
    if (stored_url) {
        readyHandler.httpServerReady(stored_url);
        console.log("Existing local HTTP server @ " + stored_url);
    }
    else {
        te_server_1.startHttpServer().then((httpUrl) => {
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
    var instance_lock = electron_1.app.requestSingleInstanceLock();
    addFlashPlugin();
    electron_1.app.whenReady().then(readyHandler.appReady);
    await startServer(instance_lock);
    /* All ready! */
    readyHandler.afterReady((httpUrl) => {
        let gameId = te_enums_1.TeGames.TRANSFORMICE;
        if (process.argv[2]) {
            let id = +process.argv[2];
            if (Object.values(te_enums_1.TeGames).includes(id)) {
                // The ID is valid and exists in the enums
                gameId = id;
            }
        }
        createWindow(gameId, httpUrl).load();
    });
    //console.log(process.argv);
})();
