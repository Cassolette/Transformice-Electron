import { app, ipcMain } from "electron";
import * as electronSets from "electron-settings";
import { FlashReleaseConfig } from "./release_config";
import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import * as path from "path";
import * as url from "url";
import fetch from "node-fetch";

const RELEASE_CONFIG = "https://raw.githubusercontent.com/Cassolette/flash-binaries/master/release.json";

var is_installing = false;

interface ReleasePerPlatform {
    version: string;
    name: string;
    url: string;
}

async function getReleaseConfig() : Promise<FlashReleaseConfig> {
    return await (await fetch(RELEASE_CONFIG)).json() as FlashReleaseConfig;
}

const ARCH_64 : {[arch: string]: boolean} = {
    "x64": true,
    "arm64": true,
    "ppc64": true
}

const MAP_TO_FPLATFORM : {[platform: string]:
        "win" | "lnx" | "mac"
    } = {
    "win32": "win",
    "linux": "lnx",
    "darwin": "mac"
}

/**
 * Retrieves release information per platform and arch.
 */
async function getReleasePerPlatform()  {
    var farch : "_64" | "_32" = ARCH_64[process.arch] ? "_64" : "_32";
    var rel_config = await getReleaseConfig();
    var fplatform = MAP_TO_FPLATFORM[process.platform];
    var freleases : ReleasePerPlatform[] = [];

    if (process.platform == "darwin") {
        throw `MacOS not supported yet`;  // TODO: support macos
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
    }
}

async function installFlash(version : string) {
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

    if (!rel) throw `No such version found.`;

    var filename = path.basename(url.parse(rel.url).pathname);

    var streamPipeline = promisify(pipeline);
    var response = await fetch(rel.url);
    if (!response.ok) throw `unexpected response ${response.statusText}`;
    var stream = createWriteStream(path.join(app.getPath("userData"), filename));
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
export function initIpc() {
    ipcMain.on("flash-release", (event) => {
        getReleasePerPlatform().then((obj) => {
            event.reply("flash-release", obj);
        }).catch();
    });

    ipcMain.on("install-flash", (event, version) => {
        installFlash(version).then(() => {
            event.reply("install-flash-success");
        }).catch((err) => {
            event.reply("install-flash-error", err);
        });
    });

    ipcMain.on("uninstall-flash", (event) => {
        uninstallFlash().then(() => {
            event.reply("uninstall-flash-success");
        }).catch((err) => {
            event.reply("uninstall-flash-error", err);
        });
    });
}
