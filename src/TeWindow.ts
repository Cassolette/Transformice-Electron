import { TeGames } from "./te-enums";
import * as path from "path";
import {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    Menu,
    shell as electronShell
} from "electron";
import { APP_NAME } from "./te-consts";
import { newTEProcess } from "./te-process";

const BASE_DIR = path.join(__dirname, "..");

const FILE_BASE = "file://" + BASE_DIR;
const FILE_URL_FAILURE = FILE_BASE + "/resources/failure.html"
const FILE_URL_PREFS = FILE_BASE + "/resources/prefs/prefs.html";

export abstract class TeWindow {
    protected httpUrl: string;
    /** The underlying electron browser window */
    public browserWindow: BrowserWindow;
    protected prefsWin: BrowserWindow;
    /** The description of the last error that happened */
    protected errorDesc: string = "";
    protected windowTitle: string = APP_NAME;
    protected windowBgColor: string = "#000000";

    /* TODO: Find out if class properties can be overriden before constructor() is called.. */
    _constructor(httpUrl: string) {
        this.httpUrl = httpUrl;

        let bwin = new BrowserWindow({
            width: 800,
            height: 600,
            frame: true,  // show default OS window frame
            useContentSize: true,  // make width & height relative to the content, not the whole window
            show: true,  // show app background instantly until content is loaded
            backgroundColor: this.windowBgColor,
            title: this.windowTitle,
            icon: path.join(BASE_DIR, "resources", "icon.png"),
            webPreferences: {
                plugins: true,
                sandbox: true,
                contextIsolation: true,
                preload: path.join(__dirname, "preload.js")
            }
        });

        bwin.setMenu(Menu.buildFromTemplate([
            {
                label: 'Zoom In',
                click: () => {
                    var webContents = bwin.webContents;
                    /* JS messes up when doing arithmetics against floats */
                    var zoomFactor = Math.round(webContents.getZoomFactor() * 100 + 10) / 100;
                    webContents.setZoomFactor(zoomFactor);
                }
            },
            {
                label: 'Zoom Out',
                click: () => {
                    var webContents = bwin.webContents;
                    /* JS messes up when doing arithmetics against floats */
                    var zoomFactor = Math.round(webContents.getZoomFactor() * 100 - 10) / 100;
                    if (zoomFactor > 0) webContents.setZoomFactor(zoomFactor);
                }
            },
            {
                label: 'Reset Zoom',
                click: () => {
                    var webContents = bwin.webContents
                    var currentZoomFactor = webContents.getZoomFactor();
                    webContents.setZoomFactor(1);
                }
            },
            {
                label: 'More',
                submenu: [
                    {
                        label: 'Reload',
                        click: () => {
                            this.load();
                        }
                    },
                    {
                        label: 'Fullscreen',
                        click: () => {
                            bwin.setFullScreen(!bwin.isFullScreen());
                        }
                    },
                    {
                        label: 'Fit Window',
                        click: () => {
                            bwin.unmaximize();
                            bwin.setFullScreen(false);
                            bwin.setContentSize(800, 600);
                        }
                    },
                    {
                        label: 'Clear Cache',
                        click: () => {
                            dialog.showMessageBox(bwin, {
                                type: "question",
                                title: "Clear Cache",
                                message: "Are you sure you want to clear the cache?",
                                detail: "This will delete cached images such as profile pictures. This is useful to reload profile pictures that have since changed. Flash player cache is NOT cleared. Please also reload the app for changes to apply.",
                                buttons: ["Cancel", "Yes"],
                                cancelId: 0,
                                defaultId: 1
                            }).then((res) => {
                                if (res.response == 1) {
                                    bwin.webContents.session.clearCache().then(() => {
                                        dialog.showMessageBox(bwin, {
                                            type: "info",
                                            title: "Clear Cache",
                                            message: "Successfully cleared cache."
                                        });
                                    });
                                }
                            });
                        }
                    },
                    {
                        label: 'Preferences',
                        click: () => {
                            this.showPreferences();
                        }
                    },
                    {
                        label: 'DevTools',
                        accelerator: 'CmdOrCtrl+Shift+I',
                        click: () => {
                            bwin.webContents.openDevTools();
                        }
                    },
                    {
                        label: 'About',
                        click: () => {
                            dialog.showMessageBox(bwin, {
                                type: "info",
                                title: "About " + APP_NAME,
                                message: "Version: " + app.getVersion()
                            });
                        }
                    },
                ]
            },
            {
                label: 'Other Games',
                submenu: [
                    {
                        label: 'Transformice',
                        click: () => {
                            newTEProcess(TeGames.TRANSFORMICE);
                        }
                    },
                    {
                        label: 'DeadMaze',
                        click: () => {
                            newTEProcess(TeGames.DEADMAZE);
                        }
                    },
                ]
            }])
        );

        let _this = this;
        bwin.webContents.on('did-fail-load', (event, errCode, errDesc) => {
            _this.onFail(errDesc);
        });

        /* Open external links in user's preferred browser rather than in Electron */
        bwin.webContents.on('new-window', (event, url) => {
            event.preventDefault();
            electronShell.openExternal(url);
        });

        /* Don't change the window title */
        bwin.on('page-title-updated', (event) => {
            event.preventDefault();
        });

        this.browserWindow = bwin;

        /* Get error from loading */
        ipcMain.on("send-te-error", (event) => {
            if (bwin.webContents.id == event.sender.id) {
                event.reply("send-te-error", _this.errorDesc);
                _this.errorDesc = "";
            }
        });
    }

    onFail(errDesc: string) {
            let bwin = this.browserWindow;
            if (!bwin.isDestroyed()) {
                bwin.loadURL(FILE_URL_FAILURE);
                //win.show();
            }
            this.errorDesc = errDesc;
    }

    showPreferences() {
        if (this.prefsWin) {
            /* already open - focus and bail out */
            this.prefsWin.focus();
            return;
        }

        this.prefsWin = new BrowserWindow({
            width: 680,
            height: 400,
            frame: true,  /* show the default window frame (exit buttons, etc.) */
            useContentSize: true,  /* make width & height relative to the content, not the whole window */
            autoHideMenuBar: true,
            title: APP_NAME,
            icon: path.join(BASE_DIR, "resources", "icon.png"),
            parent: this.browserWindow,
            webPreferences: {
                plugins: false,
                contextIsolation: false,
                enableRemoteModule: true,
                preload: path.join(BASE_DIR, "resources", "prefs", "preload_prefs.js")
            }
        });

        this.prefsWin.on("closed", () => {
            this.prefsWin = null;
            this.browserWindow.focus();
        });

        this.prefsWin.loadURL(FILE_URL_PREFS);
    }

    /** This is called when the window needs to display content. */
    abstract load(): void;
}
