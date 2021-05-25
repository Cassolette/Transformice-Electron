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
const WindowDeadMaze_1 = require("./WindowDeadMaze");
const te_server_1 = require("./te-server");
const flashrel_1 = require("./flashrel/flashrel");
const argparser_1 = require("./argparser");
const fs_1 = require("fs");
const electronSets = __importStar(require("electron-settings"));
const path = __importStar(require("path"));
const BASE_DIR = path.join(__dirname, "..");
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
    function afterReady(cb) {
        callback = cb;
        fire();
    }
    readyHandler.afterReady = afterReady;
})(readyHandler || (readyHandler = {}));
function processCustomFlashPlugin() {
    if (electronSets.getSync("flash.uninstall")) {
        let rel_path = electronSets.getSync("flash.path");
        if (rel_path) {
            var fpath = path.join(electron_1.app.getPath("userData"), rel_path);
            try {
                fs_1.unlinkSync(fpath);
            }
            catch (e) {
                throw `Could not delete file ${rel_path}: ${e}`;
            }
            electronSets.unsetSync("flash.currentVersion");
            electronSets.unsetSync("flash.path");
            electronSets.unsetSync("flash.uninstall");
            console.log(`Uninstalled ${rel_path}`);
            return false;
        }
        else {
            electronSets.unsetSync("flash.uninstall");
        }
    }
    if (electronSets.getSync("flash.enable")) {
        let rel_path = electronSets.getSync("flash.path");
        if (rel_path) {
            let fullpath = path.join(electron_1.app.getPath("userData"), rel_path);
            electron_1.app.commandLine.appendSwitch('ppapi-flash-path', fullpath);
            console.log("Loading downloaded Flash", rel_path);
            return true;
        }
    }
    return false;
}
function addFlashPlugin() {
    var use_custom = false;
    try {
        use_custom = processCustomFlashPlugin();
    }
    catch (e) {
        console.error(e);
    }
    if (use_custom)
        return;
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
(function () {
    var instance_lock = electron_1.app.requestSingleInstanceLock();
    var argp = new argparser_1.ArgpObject(process.argv);
    addFlashPlugin();
    electron_1.app.whenReady().then(readyHandler.appReady);
    te_server_1.retrieveServer(instance_lock).then(readyHandler.httpServerReady);
    flashrel_1.initIpc();
    readyHandler.afterReady((httpUrl) => {
        let gameId = te_enums_1.TeGames.TRANSFORMICE;
        let id;
        if (id = argp.getFlag("game-id")) {
            id = +id;
            if (Object.values(te_enums_1.TeGames).includes(id)) {
                gameId = id;
            }
        }
        createWindow(gameId, httpUrl).load();
    });
})();
