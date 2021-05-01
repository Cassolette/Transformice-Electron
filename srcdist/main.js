"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var te_enums_1 = require("./te-enums");
var WindowTransformice_1 = require("./WindowTransformice");
var te_server_1 = require("./te-server");
var path = require("path");
var WindowDeadMaze_1 = require("./WindowDeadMaze");
var BASE_DIR = path.join(__dirname, "..");
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
    var pluginName;
    var iden;
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
/* Start things up */
addFlashPlugin();
electron_1.app.whenReady().then(readyHandler.appReady);
te_server_1.startHttpServer().then(readyHandler.httpServerReady);
/* All ready! */
readyHandler.afterReady(function (httpUrl) {
    var gameId = te_enums_1.TeGames.TRANSFORMICE;
    if (process.argv[2]) {
        var id = +process.argv[2];
        if (Object.values(te_enums_1.TeGames).includes(id)) {
            // The ID is valid and exists in the enums
            gameId = id;
        }
    }
    createWindow(gameId, httpUrl).load();
});
console.log(process.argv);
