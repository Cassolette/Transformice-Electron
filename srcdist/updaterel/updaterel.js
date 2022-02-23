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
exports.uninstallReleaseWorker = exports.ReleaseChecker = void 0;
const proc = __importStar(require("child_process"));
const electron_1 = require("electron");
const electronSets = __importStar(require("electron-settings"));
const fs_1 = require("fs");
const got_1 = __importDefault(require("got"));
const path = __importStar(require("path"));
const pupa_1 = __importDefault(require("pupa"));
const semver_1 = __importDefault(require("semver"));
const stream_1 = require("stream");
const url_1 = require("url");
const util_1 = require("util");
const execFile = util_1.promisify(proc.execFile);
const streamPipeline = util_1.promisify(stream_1.pipeline);
const RELEASE_CONFIG = "https://cassolette.github.io/Transformice-Electron/release-v1.json";
const MAP_TO_ARCHTYPE = {
    "win32": "windows",
    "linux": "linux",
    "darwin": "macos"
};
function downloadPath(filename) {
    return path.join(electron_1.app.getPath("userData"), filename);
}
class ReleaseConfig {
    constructor() { }
    static fromJson(json) {
        const rel = Object.assign(new ReleaseConfig(), json);
        for (const ver in json.releaseMeta) {
            const meta = json.releaseMeta[ver];
            rel.releaseMeta[ver] = ReleaseMeta.fromJson(rel, meta);
        }
        return rel;
    }
}
class ReleaseMeta {
    constructor(releaseConfig) {
        this.releaseConfig = releaseConfig;
    }
    static fromJson(releaseConfig, json) {
        return Object.assign(new ReleaseMeta(releaseConfig), json);
    }
    getReleaseUrl(arch) {
        if (this.overrideArchUrl && this.overrideArchUrl[arch]) {
            return this.overrideArchUrl[arch];
        }
        const syntax = this.releaseConfig.urlSyntax[arch];
        return pupa_1.default(syntax, {
            version: this.version
        });
    }
}
class ReleaseChecker {
    constructor() {
        this.arch = MAP_TO_ARCHTYPE[process.platform];
    }
    static async getChecker() {
        const rc = new ReleaseChecker();
        await rc.refreshConfig();
        return rc;
    }
    async refreshConfig() {
        this.releaseConfig = ReleaseConfig.fromJson(await got_1.default(RELEASE_CONFIG).json());
    }
    hasUpdate() {
        const rel = this.releaseConfig;
        const latest = rel.archLatest[this.arch].stable;
        if (!latest)
            return false;
        return semver_1.default.lt(electron_1.app.getVersion(), latest);
    }
    async pullUpdate() {
        const rel = this.releaseConfig;
        const latest = rel.archLatest[this.arch].stable;
        const latestMeta = rel.releaseMeta[latest];
        const relUrl = latestMeta.getReleaseUrl(this.arch);
        const filename = path.basename(new url_1.URL(relUrl).pathname);
        const absoluteTarget = downloadPath(filename);
        const writeStream = fs_1.createWriteStream(absoluteTarget);
        try {
            await streamPipeline(got_1.default.stream(relUrl), writeStream);
        }
        catch (e) {
            throw `Unexpected response: ${e}`;
        }
        return filename;
    }
    async doUpdate() {
        const targetFilename = await this.pullUpdate();
        await electronSets.set("updaterel.downloadedFile", targetFilename);
        await execFile(downloadPath(targetFilename));
    }
}
exports.ReleaseChecker = ReleaseChecker;
async function uninstallReleaseWorker() {
    const targetFilename = await electronSets.get("updaterel.downloadedFile");
    if (typeof targetFilename !== "string") {
        console.error(`Corrupt updaterel.downloadedFile: ${targetFilename.toString()}`);
        await electronSets.unset("updaterel.downloadedFile");
        return;
    }
    const fpath = downloadPath(targetFilename);
    let fileExists = false;
    try {
        await fs_1.promises.access(fpath);
        try {
            await fs_1.promises.unlink(fpath);
            console.log(`Cleaned orphaned file: ${targetFilename}`);
        }
        catch (e) {
            console.error(`Could not delete file ${targetFilename}: ${e}`);
            return;
        }
    }
    catch {
        console.error(`File does not exist, ignoring: ${targetFilename}`);
    }
    await electronSets.unset("updaterel.downloadedFile");
}
exports.uninstallReleaseWorker = uninstallReleaseWorker;
