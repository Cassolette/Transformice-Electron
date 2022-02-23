import * as proc from "child_process";
import { app } from "electron";
import * as electronSets from "electron-settings";
import { createWriteStream, promises as fsPromises } from "fs";
import got from "got";
import * as path from "path";
import pupa from "pupa";
import semver from "semver";
import { pipeline } from "stream";
import { URL } from 'url';
import { promisify } from "util";
import { IReleaseConfig, IReleaseMeta, ReleaseArchType } from "./release-config";

const execFile = promisify(proc.execFile);
const streamPipeline = promisify(pipeline);

const RELEASE_CONFIG = "https://cassolette.github.io/Transformice-Electron/release-v1.json";

const MAP_TO_ARCHTYPE: Partial<Record<NodeJS.Platform, ReleaseArchType>> = {
    "win32": "windows",
    "linux": "linux",
    "darwin": "macos"
}

function downloadPath(filename: string) {
    return path.join(app.getPath("userData"), filename);
}

class ReleaseConfig implements IReleaseConfig {
    jsonVersion: number;
    homepage?: string;
    archLatest: Record<ReleaseArchType, Partial<Record<"stable", string>>>;
    releaseMeta: Record<string, ReleaseMeta>;
    urlSyntax: Partial<Record<ReleaseArchType, string>>;

    private constructor() { }

    static fromJson(json: IReleaseConfig) {
        const rel = Object.assign(new ReleaseConfig(), json);

        // Re-build meta with proper object
        for (const ver in json.releaseMeta) {
            const meta = json.releaseMeta[ver];
            rel.releaseMeta[ver] = ReleaseMeta.fromJson(rel, meta);
        }

        return rel;
    }
}

class ReleaseMeta implements IReleaseMeta {
    version: string;
    incrementalVersion: number;
    type: "stable";
    overrideArchUrl?: Partial<Record<ReleaseArchType, string>>;

    private constructor(
        private releaseConfig: ReleaseConfig
    ) { }

    static fromJson(releaseConfig: ReleaseConfig, json: IReleaseMeta) {
        return Object.assign(new ReleaseMeta(releaseConfig), json);
    }


    getReleaseUrl(arch: ReleaseArchType) {
        if (this.overrideArchUrl && this.overrideArchUrl[arch]) {
            return this.overrideArchUrl[arch];
        }

        // Default URL
        const syntax = this.releaseConfig.urlSyntax[arch];
        // Replace version placeholder
        return pupa(syntax, {
            version: this.version
        });
    }

}

export class ReleaseChecker {
    releaseConfig: ReleaseConfig;
    arch: ReleaseArchType;

    private constructor() {
        this.arch = MAP_TO_ARCHTYPE[process.platform];
    }

    /**
     * Create a new release checker session.
     */
    static async getChecker() {
        const rc = new ReleaseChecker();
        await rc.refreshConfig();
        return rc;
    }

    async refreshConfig() {
        this.releaseConfig = ReleaseConfig.fromJson(
            await got(RELEASE_CONFIG).json() as IReleaseConfig
        );
    }

    hasUpdate() {
        const rel = this.releaseConfig;

        const latest = rel.archLatest[this.arch].stable;
        if (!latest) return false;

        return semver.lt(app.getVersion(), latest);
    }

    private async pullUpdate() {
        const rel = this.releaseConfig;
        const latest = rel.archLatest[this.arch].stable;
        const latestMeta = rel.releaseMeta[latest];

        const relUrl = latestMeta.getReleaseUrl(this.arch);
        const filename = path.basename(new URL(relUrl).pathname);

        const absoluteTarget = downloadPath(filename);

        const writeStream = createWriteStream(absoluteTarget);

        try {
            await streamPipeline(got.stream(relUrl), writeStream);
        } catch (e) {
            throw `Unexpected response: ${e}`;
        }

        return filename;
    }

    async doUpdate() {
        const targetFilename = await this.pullUpdate();

        // Schedule for removal on startup
        await electronSets.set("updaterel.downloadedFile", targetFilename);

        // Run the installer
        await execFile(downloadPath(targetFilename));
    }
}

/**
 * Clears any releases that are scheduled for removal.
 */
export async function releaseRemovalWorker() {
    const targetFilename = await electronSets.get("updaterel.downloadedFile");

    if (!targetFilename) {
        return;
    }

    // Corrupt settings check
    if (typeof targetFilename !== "string") {
        console.error(`Corrupt updaterel.downloadedFile: ${targetFilename.toString()}`);
        await electronSets.unset("updaterel.downloadedFile");
        return;
    }

    const fpath = downloadPath(targetFilename);

    let fileExists = false;
    try {
        await fsPromises.access(fpath);
        
        // File exists
        try {
            await fsPromises.unlink(fpath);
            console.log(`Cleaned orphaned file: ${targetFilename}`);
        } catch (e) {
            // Most likely being locked
            console.error(`Could not delete file ${targetFilename}: ${e}`);
            return;
        }
    } catch {
        console.error(`File does not exist, ignoring: ${targetFilename}`);
    }

    // Done.
    await electronSets.unset("updaterel.downloadedFile");
}
