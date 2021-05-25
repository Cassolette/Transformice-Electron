import { app, ipcMain } from "electron";
import { FlashReleaseConfig } from "./release_config";
import { ESettingsFlash, ESettingsFlashUninstall } from "./flash_settings";
import { createWriteStream, existsSync, unlinkSync, promises as fsPromises } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import * as electronSets from "electron-settings";
import * as path from "path";
import * as url from "url";
import * as tar from "tar";
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
    // Check if an uninstallation for this version was scheduled; If so, undo it
    var uninstalls = electronSets.getSync("flash.uninstall") as ESettingsFlash['uninstall'];
    if (Array.isArray(uninstalls)) {
        let found_uninstall = null;
        for (let i = 0; i < uninstalls.length; i++) {
            if (uninstalls[i].version == version) {
                // Undo the uninstallation
                await electronSets.set("flash.currentVersion", version);
                await electronSets.set("flash.path", uninstalls[i].path);
                uninstalls.splice(i);
                if (uninstalls.length > 0) {
                    // Save the new array
                    electronSets.setSync("flash.uninstall", uninstalls);
                } else {
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

    if (!rel) throw `No such version found.`;

    var filename = path.basename(url.parse(rel.url).pathname);
    var file_ext = path.extname(filename);
    var absolute_file = path.join(app.getPath("userData"), filename);

    var streamPipeline = promisify(pipeline);
    var response = await fetch(rel.url);
    if (!response.ok) throw `Unexpected response ${response.statusText}`;
    var stream = createWriteStream(absolute_file);
    await streamPipeline(response.body, stream);

    if (file_ext == ".tar") {
        // On MacOS, we untar the archive
        let plugin_path = path.join(app.getPath("userData"), `PepperFlash.${version}.plugin`);

        try {
            await fsPromises.access(plugin_path);
            await fsPromises.rmdir(plugin_path, { recursive: true });
        } catch (e) {
            // Directory does not exist probably
        }
        await fsPromises.mkdir(plugin_path);

        // Extract tar to `plugin_path`
        tar.x({
            file: absolute_file,
            cwd: plugin_path
        });

        filename = plugin_path;
    }

    // Uninstall the old version
    try {
        await uninstallFlash();
    } catch (e) {}

    // Link to the new version
    await electronSets.set("flash.currentVersion", version);
    await electronSets.set("flash.path", filename);
}

/**
 * Schedules the removal of currently installed Flash version
 * @throws On error
 */
async function uninstallFlash() {
    var uninstall_paths = await
            electronSets.get("flash.uninstall") as ESettingsFlash['uninstall'] || [];
    var fpath = await electronSets.get("flash.path") as ESettingsFlash['path'];
    var version = await electronSets.get("flash.currentVersion") as ESettingsFlash['currentVersion'];

    if (!fpath || !version) throw "No Flash installation is detected";
    uninstall_paths.push({
        path: fpath,
        version: version
    });

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

    // Trigger Flash removal
    ipcMain.on("uninstall-flash", (event) => {
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

/**
 * Uninstalls any scheduled Flash removals. This should be called where your application
 * is most likely to not be locking the plugins (such as at init or exit). 
 */
export function uninstallFlashWorker() {
    var uninstalls = electronSets.getSync("flash.uninstall") as ESettingsFlash['uninstall'];
    if (Array.isArray(uninstalls)) {
        // Uninstall was scheduled
        for (let i = 0; i < uninstalls.length; i++) {
            var fpath = path.join(app.getPath("userData"), uninstalls[i].path);
            if (existsSync(fpath)) {
                try {
                    unlinkSync(fpath);
                } catch (e) {
                    // Most likely being locked
                    console.error(`Could not delete file ${uninstalls[i].path}: ${e}`);
                    continue;
                }
            }
            console.log(`Uninstalled ${uninstalls[i].version}`);
            uninstalls[i] = null;
        }

        // Compact the array
        uninstalls = uninstalls.filter(x => x);
        if (uninstalls.length > 0) {
            // Save the new array
            electronSets.setSync("flash.uninstall", uninstalls);
        } else {
            electronSets.unsetSync("flash.uninstall");
        }
    } else if (uninstalls) {
        // Invalid setting
        electronSets.unsetSync("flash.uninstall");
    }
}
