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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeWindow = void 0;
const te_enums_1 = require("./te-enums");
const path = __importStar(require("path"));
const electron_1 = require("electron");
const te_consts_1 = require("./te-consts");
const te_process_1 = require("./te-process");
const BASE_DIR = path.join(__dirname, "..");
const FILE_BASE = "file://" + BASE_DIR;
const FILE_URL_FAILURE = FILE_BASE + "/resources/failure.html";
const FILE_URL_PREFS = FILE_BASE + "/resources/prefs/prefs.html";
class TeWindow {
    constructor() {
        /** The description of the last error that happened */
        this.errorDesc = "";
        this.windowTitle = te_consts_1.APP_NAME;
        this.windowBgColor = "#000000";
    }
    /* TODO: Find out if class properties can be overriden before constructor() is called.. */
    _constructor(httpUrl) {
        this.httpUrl = httpUrl;
        let bwin = new electron_1.BrowserWindow({
            width: 800,
            height: 600,
            frame: true,
            useContentSize: true,
            show: true,
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
        bwin.setMenu(electron_1.Menu.buildFromTemplate([
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
                    if (zoomFactor > 0)
                        webContents.setZoomFactor(zoomFactor);
                }
            },
            {
                label: 'Reset Zoom',
                click: () => {
                    var webContents = bwin.webContents;
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
                            electron_1.dialog.showMessageBox(bwin, {
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
                                        electron_1.dialog.showMessageBox(bwin, {
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
                            electron_1.dialog.showMessageBox(bwin, {
                                type: "info",
                                title: "About " + te_consts_1.APP_NAME,
                                message: "Version: " + electron_1.app.getVersion()
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
                            te_process_1.newTEProcess(te_enums_1.TeGames.TRANSFORMICE);
                        }
                    },
                    {
                        label: 'DeadMaze',
                        click: () => {
                            te_process_1.newTEProcess(te_enums_1.TeGames.DEADMAZE);
                        }
                    },
                ]
            }
        ]));
        let _this = this;
        bwin.webContents.on('did-fail-load', (event, errCode, errDesc) => {
            _this.onFail(errDesc);
        });
        /* Open external links in user's preferred browser rather than in Electron */
        bwin.webContents.on('new-window', (event, url) => {
            event.preventDefault();
            electron_1.shell.openExternal(url);
        });
        /* Don't change the window title */
        bwin.on('page-title-updated', (event) => {
            event.preventDefault();
        });
        this.browserWindow = bwin;
        /* Get error from loading */
        electron_1.ipcMain.on("send-te-error", (event) => {
            if (bwin.webContents.id == event.sender.id) {
                event.reply("send-te-error", _this.errorDesc);
                _this.errorDesc = "";
            }
        });
    }
    onFail(errDesc) {
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
        this.prefsWin = new electron_1.BrowserWindow({
            width: 680,
            height: 400,
            frame: true,
            useContentSize: true,
            autoHideMenuBar: true,
            title: te_consts_1.APP_NAME,
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
}
exports.TeWindow = TeWindow;
