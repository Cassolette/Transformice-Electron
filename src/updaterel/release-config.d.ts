export interface IReleaseConfig {
    /**
     * The internal JSON release version, used for compatibility checks.
     */
    jsonVersion: number;

    /**
     * The URL to the homepage.
     */
    homepage?: string;

    /**
     * Lists the latest versions for the architectures.
     */
    archLatest: Record<
        ReleaseArchType,
        Partial<Record<ReleaseBranchType, string>>
    >;

    /**
     * The default syntax for all the release URL. This can be individually overriden in the meta with `overrideArchUrl`.
     */
    urlSyntax: Partial<Record<ReleaseArchType, string>>;

    /**
     * Lists metadata for the various releases.
     */
    releaseMeta: Record<ReleaseVersion, IReleaseMeta>;
}

export interface IReleaseMeta {
    /**
     * The release version identifier.
     */
    version: string;

    /**
     * The incremental version identifier.
     * @deprecated
     */
    incrementalVersion: number;

    /**
     * The release branch.
     */
    type: ReleaseBranchType;

    /**
     * The direct URL override for the architecture.
     */
    overrideArchUrl?: Partial<Record<ReleaseArchType, string>>;
}

export type ReleaseBranchType = "stable";
export type ReleaseArchType = "windows" | "macos" | "linux";
export type ReleaseVersion = string;
