export type ESettingsFlashUninstall = {
    /**
     * Relative path to the Flash plugin library
     */
     path: string;
     /**
      * Version identifier for the Flash plugin
      */
     version: string;
}

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
    uninstall: ESettingsFlashUninstall[]?;
}
