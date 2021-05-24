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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initIpc = void 0;
const electron_1 = require("electron");
const electronSets = __importStar(require("electron-settings"));
const fs_1 = require("fs");
const stream_1 = require("stream");
const util_1 = require("util");
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const RELEASE_CONFIG = "https://raw.githubusercontent.com/Cassolette/flash-binaries/master/release.json";
var is_installing = false;
async function getReleaseConfig() {
    return await (await node_fetch_1.default(RELEASE_CONFIG)).json();
}
const ARCH_64 = {
    "x64": true,
    "arm64": true,
    "ppc64": true
};
const MAP_TO_FPLATFORM = {
    "win32": "win",
    "linux": "lnx",
    "darwin": "mac"
};
/**
 * Retrieves release information per platform and arch.
 */
async function getReleasePerPlatform() {
    var farch = ARCH_64[process.arch] ? "_64" : "_32";
    var rel_config = await getReleaseConfig();
    var fplatform = MAP_TO_FPLATFORM[process.platform];
    var freleases = [];
    if (process.platform == "darwin") {
        throw `MacOS not supported yet`; // TODO: support macos
    }
    rel_config[fplatform].releases.forEach((rel) => {
        freleases.push({
            version: rel.version,
            name: rel.name,
            url: rel[farch]
        });
    });
    return {
        latest: rel_config[fplatform].latest[farch],
        releases: freleases
    };
}
async function installFlash(version) {
    if (is_installing) {
        throw "Installation is still in progress.";
    }
    is_installing = true;
    var releases = (await getReleasePerPlatform()).releases;
    var rel = null;
    for (let i = 0; i < releases.length; i++) {
        let r = releases[i];
        if (r.version == version) {
            rel = r;
            break;
        }
    }
    if (!rel)
        throw `No such version found.`;
    var filename = path.basename(url.parse(rel.url).pathname);
    var streamPipeline = util_1.promisify(stream_1.pipeline);
    var response = await node_fetch_1.default(rel.url);
    if (!response.ok)
        throw `unexpected response ${response.statusText}`;
    var stream = fs_1.createWriteStream(path.join(electron_1.app.getPath("userData"), filename));
    await streamPipeline(response.body, stream);
    await electronSets.set("flash.currentVersion", version);
    await electronSets.set("flash.path", filename);
    is_installing = false;
}
async function uninstallFlash() {
    if (is_installing) {
        throw "Installation is still in progress.";
    }
    is_installing = true;
    await electronSets.set("flash.uninstall", true);
    is_installing = false;
}
/**
 * Register IPC callbacks for the preferences window.
 */
function initIpc() {
    electron_1.ipcMain.on("flash-release", (event) => {
        getReleasePerPlatform().then((obj) => {
            event.reply("flash-release", obj);
        }).catch();
    });
    electron_1.ipcMain.on("install-flash", (event, version) => {
        installFlash(version).then(() => {
            event.reply("install-flash-success");
        }).catch((err) => {
            event.reply("install-flash-error", err);
        });
    });
    electron_1.ipcMain.on("uninstall-flash", (event) => {
        uninstallFlash().then(() => {
            event.reply("uninstall-flash-success");
        }).catch((err) => {
            event.reply("uninstall-flash-error", err);
        });
    });
}
exports.initIpc = initIpc;
