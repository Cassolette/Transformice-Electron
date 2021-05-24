type FlashReleasePropertiesLatest = {
    /**
     * Version identifier for 32-bit architecture
     */
    _32: string?;
    /**
     * Version identifier for 64-bit architecture
     */
    _64: string?;
}

type FlashReleasePropertiesReleases = {
    /**
     * The version identifier
     */
    version: string;
    /**
     * The name of the release
     */
    name: string;
    /**
     * URL to the 32-bit architecture artifact
     */
    _32: string?;
    /**
     * URL to the 64-bit architecture artifact
     */
    _64: string?;
}

type FlashReleaseProperties = {
    /**
     * Object defining the latest version identifier for the respective architecture
     */
    latest: FlashReleasePropertiesLatest;
    releases: FlashReleasePropertiesReleases[];
}

export type FlashReleaseConfig = {
    /**
     * Windows platform
     */
    win: FlashReleaseProperties;
    /**
     * Linux platform
     */
    lnx: FlashReleaseProperties;
    /**
     * MacOS platform
     */
    mac: FlashReleaseProperties;
}
