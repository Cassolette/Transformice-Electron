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
exports.uninstallFlashWorker = exports.initIpc = void 0;
const electron_1 = require("electron");
const fs_1 = require("fs");
const stream_1 = require("stream");
const util_1 = require("util");
const electronSets = __importStar(require("electron-settings"));
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const tar = __importStar(require("tar"));
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
async function getReleasePerPlatform() {
    var farch = ARCH_64[process.arch] ? "_64" : "_32";
    var rel_config = await getReleaseConfig();
    var fplatform = MAP_TO_FPLATFORM[process.platform];
    var freleases = [];
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
    var uninstalls = electronSets.getSync("flash.uninstall");
    if (Array.isArray(uninstalls)) {
        let found_uninstall = null;
        for (let i = 0; i < uninstalls.length; i++) {
            if (uninstalls[i].version == version) {
                await electronSets.set("flash.currentVersion", version);
                await electronSets.set("flash.path", uninstalls[i].path);
                uninstalls.splice(i);
                if (uninstalls.length > 0) {
                    electronSets.setSync("flash.uninstall", uninstalls);
                }
                else {
                    electronSets.unsetSync("flash.uninstall");
                }
                return;
            }
        }
    }
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
    var file_ext = path.extname(filename);
    var absolute_file = path.join(electron_1.app.getPath("userData"), filename);
    var streamPipeline = util_1.promisify(stream_1.pipeline);
    var response = await node_fetch_1.default(rel.url);
    if (!response.ok)
        throw `Unexpected response ${response.statusText}`;
    var stream = fs_1.createWriteStream(absolute_file);
    await streamPipeline(response.body, stream);
    if (file_ext == ".tar") {
        let plugin_path = path.join(electron_1.app.getPath("userData"), `PepperFlash.${version}.plugin`);
        try {
            await fs_1.promises.access(plugin_path);
            await fs_1.promises.rmdir(plugin_path, { recursive: true });
        }
        catch (e) {
        }
        await fs_1.promises.mkdir(plugin_path);
        tar.x({
            file: absolute_file,
            cwd: plugin_path
        });
        filename = plugin_path;
    }
    try {
        await uninstallFlash();
    }
    catch (e) { }
    await electronSets.set("flash.currentVersion", version);
    await electronSets.set("flash.path", filename);
}
async function uninstallFlash() {
    var uninstall_paths = await electronSets.get("flash.uninstall") || [];
    var fpath = await electronSets.get("flash.path");
    var version = await electronSets.get("flash.currentVersion");
    if (!fpath || !version)
        throw "No Flash installation is detected";
    uninstall_paths.push({
        path: fpath,
        version: version
    });
    await electronSets.unset("flash.path");
    await electronSets.unset("flash.currentVersion");
    await electronSets.set("flash.uninstall", uninstall_paths);
}
function initIpc() {
    electron_1.ipcMain.on("flash-release", (event) => {
        getReleasePerPlatform().then((obj) => {
            event.reply("flash-release", obj);
        }).catch();
    });
    electron_1.ipcMain.on("install-flash", (event, version) => {
        if (is_installing) {
            event.reply("uninstall-flash-error", "Installation is still in progress.");
            return;
        }
        is_installing = true;
        installFlash(version).then(() => {
            is_installing = false;
            event.reply("install-flash-success");
        }).catch((err) => {
            is_installing = false;
            event.reply("install-flash-error", err);
        });
    });
    electron_1.ipcMain.on("uninstall-flash", (event) => {
        if (is_installing) {
            event.reply("uninstall-flash-error", "Installation is still in progress.");
            return;
        }
        is_installing = true;
        uninstallFlash().then(() => {
            is_installing = false;
            event.reply("uninstall-flash-success");
        }).catch((err) => {
            is_installing = false;
            event.reply("uninstall-flash-error", err);
        });
    });
}
exports.initIpc = initIpc;
function uninstallFlashWorker() {
    var uninstalls = electronSets.getSync("flash.uninstall");
    if (Array.isArray(uninstalls)) {
        for (let i = 0; i < uninstalls.length; i++) {
            var fpath = path.join(electron_1.app.getPath("userData"), uninstalls[i].path);
            if (fs_1.existsSync(fpath)) {
                try {
                    fs_1.unlinkSync(fpath);
                }
                catch (e) {
                    console.error(`Could not delete file ${uninstalls[i].path}: ${e}`);
                    continue;
                }
            }
            console.log(`Uninstalled ${uninstalls[i].version}`);
            uninstalls[i] = null;
        }
        uninstalls = uninstalls.filter(x => x);
        if (uninstalls.length > 0) {
            electronSets.setSync("flash.uninstall", uninstalls);
        }
        else {
            electronSets.unsetSync("flash.uninstall");
        }
    }
    else if (uninstalls) {
        electronSets.unsetSync("flash.uninstall");
    }
}
exports.uninstallFlashWorker = uninstallFlashWorker;
