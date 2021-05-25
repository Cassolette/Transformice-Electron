import { app, ipcMain } from "electron";
import * as electronSets from "electron-settings";
import { FlashReleaseConfig } from "./release_config";
import { ESettingsFlash } from "./flash_settings";
import { createWriteStream, existsSync, unlinkSync } from "fs";
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

/**
 * Downloads and installs the given flash version
 * @throws On error
 */
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
    if (!response.ok) throw `Unexpected response ${response.statusText}`;
    var stream = createWriteStream(path.join(app.getPath("userData"), filename));
    await streamPipeline(response.body, stream);

    await electronSets.set("flash.currentVersion", version);
    await electronSets.set("flash.path", filename);
}

/**
 * Schedules the removal of currently installed Flash version
 * @throws On error
 */
async function uninstallFlash() {
    if (is_installing) {
        throw "Installation is still in progress.";
    }
    is_installing = true;

    var uninstall_paths : string[];
    var fpath : string | null;

    uninstall_paths = await
            electronSets.get("flash.uninstall") as ESettingsFlash['uninstall'] || [];
    fpath = await electronSets.get("flash.path") as ESettingsFlash['path'];

    if (!fpath) throw "No Flash installation is detected";
    uninstall_paths.push(fpath);

    await electronSets.unset("flash.path");
    await electronSets.unset("flash.currentVersion");
    await electronSets.set("flash.uninstall", uninstall_paths);
}

/**
 * Register IPC callbacks for the preferences window.
 */
export function initIpc() {
    // Query Flash releases per platform
    ipcMain.on("flash-release", (event) => {
        getReleasePerPlatform().then((obj) => {
            event.reply("flash-release", obj);
        }).catch();
    });

    // Trigger Flash installation
    ipcMain.on("install-flash", (event, version) => {
        installFlash(version).then(() => {
            is_installing = false;
            event.reply("install-flash-success");
        }).catch((err) => {
            is_installing = false;
            event.reply("install-flash-error", err);
        });
    });

    // Trigger Flash removal
    ipcMain.on("uninstall-flash", (event) => {
        uninstallFlash().then(() => {
            is_installing = false;
            event.reply("uninstall-flash-success");
        }).catch((err) => {
            is_installing = false;
            event.reply("uninstall-flash-error", err);
        });
    });
}

/**
 * Uninstalls any scheduled Flash removals. This should be called where your application
 * is most likely to not be locking the plugins (such as at init or exit). 
 */
export function uninstallFlashWorker() {
    var uninstall_paths = electronSets.getSync("flash.uninstall") as ESettingsFlash['uninstall'];
    if (Array.isArray(uninstall_paths)) {
        // Uninstall was scheduled
        for (let i = 0; i < uninstall_paths.length; i++) {
            var fpath = path.join(app.getPath("userData"), uninstall_paths[i]);
            if (existsSync(fpath)) {
                try {
                    unlinkSync(fpath);
                } catch (e) {
                    // Most likely being locked
                    console.error(`Could not delete file ${uninstall_paths[i]}: ${e}`);
                    continue;
                }
            }
            uninstall_paths[i] = null;
            console.log(`Uninstalled ${uninstall_paths[i]}`);
        }

        // Compact the array
        uninstall_paths = uninstall_paths.filter(x => x);
        if (uninstall_paths.length > 0) {
            // Save the new array
            electronSets.setSync("flash.uninstall", uninstall_paths);
        } else {
            electronSets.unsetSync("flash.uninstall");
        }
    } else if (uninstall_paths) {
        // Invalid setting
        electronSets.unsetSync("flash.uninstall");
    }
}
