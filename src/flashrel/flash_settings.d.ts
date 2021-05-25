export type ESettingsFlash = {
    /**
     * Whether downloaded Flash is enabled
     */
    enable: boolean?;
    /**
     * Relative path to the Flash plugin library
     */
    path: string?;
    /**
     * Current version identifier
     */
    currentVersion: string?;
    /**
     * An array of paths to remove
     */
    uninstall: string[]?;
}
