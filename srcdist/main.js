"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var electron_1 = require("electron");
var te_enums_1 = require("./te-enums");
var WindowTransformice_1 = require("./WindowTransformice");
var te_server_1 = require("./te-server");
var WindowDeadMaze_1 = require("./WindowDeadMaze");
var path = require("path");
var fs = require("fs");
var BASE_DIR = path.join(__dirname, "..");
var SERVER_URL_FILE = path.join(electron_1.app.getPath("userData"), "server.te");
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
function startServer(instance_lock) {
    return __awaiter(this, void 0, void 0, function () {
        var stored_url, server_url, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stored_url = null;
                    if (!!instance_lock) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    server_url = fs.readFileSync(SERVER_URL_FILE).toString();
                    return [4 /*yield*/, te_server_1.testHttpServer(server_url)];
                case 2:
                    // Test if this server responds
                    if (_a.sent()) {
                        stored_url = server_url;
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4:
                    if (stored_url) {
                        readyHandler.httpServerReady(stored_url);
                        console.log("Existing local HTTP server @ " + stored_url);
                    }
                    else {
                        te_server_1.startHttpServer().then(function (httpUrl) {
                            // Store the current HTTP url
                            fs.writeFile(SERVER_URL_FILE, httpUrl, function (err) {
                                if (err) {
                                    console.error("Failed to save TE server URL.");
                                }
                            });
                            readyHandler.httpServerReady(httpUrl);
                            console.log("Set up local HTTP server @ " + httpUrl);
                        });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/* Start things up */
(function () {
    return __awaiter(this, void 0, void 0, function () {
        var instance_lock;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    instance_lock = electron_1.app.requestSingleInstanceLock();
                    addFlashPlugin();
                    electron_1.app.whenReady().then(readyHandler.appReady);
                    return [4 /*yield*/, startServer(instance_lock)];
                case 1:
                    _a.sent();
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
                    return [2 /*return*/];
            }
        });
    });
})();
