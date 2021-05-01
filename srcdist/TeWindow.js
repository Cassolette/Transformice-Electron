"use strict";
exports.__esModule = true;
exports.TeWindow = void 0;
var te_enums_1 = require("./te-enums");
var path = require("path");
var electron_1 = require("electron");
var te_consts_1 = require("./te-consts");
var te_process_1 = require("./te-process");
var BASE_DIR = path.join(__dirname, "..");
var FILE_BASE = "file://" + BASE_DIR;
var FILE_URL_FAILURE = FILE_BASE + "/resources/failure.html";
var FILE_URL_PREFS = FILE_BASE + "/resources/prefs/prefs.html";
var TeWindow = /** @class */ (function () {
    function TeWindow() {
        this.windowTitle = te_consts_1.APP_NAME;
        this.windowBgColor = "#000000";
    }
    /* TODO: Find out if class properties can be overriden before constructor() is called.. */
    TeWindow.prototype._constructor = function (httpUrl) {
        var _this = this;
        this.httpUrl = httpUrl;
        var bwin = new electron_1.BrowserWindow({
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
                contextIsolation: false,
                preload: path.join(__dirname, "preload.js")
            }
        });
        bwin.setMenu(electron_1.Menu.buildFromTemplate([
            {
                label: 'Zoom In',
                click: function () {
                    var webContents = bwin.webContents;
                    /* JS messes up when doing arithmetics against floats */
                    var zoomFactor = Math.round(webContents.getZoomFactor() * 100 + 10) / 100;
                    webContents.setZoomFactor(zoomFactor);
                }
            },
            {
                label: 'Zoom Out',
                click: function () {
                    var webContents = bwin.webContents;
                    /* JS messes up when doing arithmetics against floats */
                    var zoomFactor = Math.round(webContents.getZoomFactor() * 100 - 10) / 100;
                    if (zoomFactor > 0)
                        webContents.setZoomFactor(zoomFactor);
                }
            },
            {
                label: 'Reset Zoom',
                click: function () {
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
                        click: function () {
                            _this.load();
                        }
                    },
                    {
                        label: 'Fullscreen',
                        click: function () {
                            bwin.setFullScreen(!bwin.isFullScreen());
                        }
                    },
                    {
                        label: 'Fit Window',
                        click: function () {
                            bwin.unmaximize();
                            bwin.setFullScreen(false);
                            bwin.setContentSize(800, 600);
                        }
                    },
                    {
                        label: 'Clear Cache',
                        click: function () {
                            electron_1.dialog.showMessageBox(bwin, {
                                type: "question",
                                title: "Clear Cache",
                                message: "Are you sure you want to clear the cache?",
                                detail: "This will delete cached images such as profile pictures. This is useful to reload profile pictures that have since changed. Flash player cache is NOT cleared. Please also reload the app for changes to apply.",
                                buttons: ["Cancel", "Yes"],
                                cancelId: 0,
                                defaultId: 1
                            }).then(function (res) {
                                if (res.response == 1) {
                                    bwin.webContents.session.clearCache().then(function () {
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
                        click: function () {
                            _this.showPreferences();
                        }
                    },
                    {
                        label: 'DevTools',
                        accelerator: 'CmdOrCtrl+Shift+I',
                        click: function () {
                            bwin.webContents.openDevTools();
                        }
                    },
                    {
                        label: 'About',
                        click: function () {
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
                        click: function () {
                            te_process_1.newTEProcess(te_enums_1.TeGames.TRANSFORMICE);
                        }
                    },
                    {
                        label: 'DeadMaze',
                        click: function () {
                            te_process_1.newTEProcess(te_enums_1.TeGames.DEADMAZE);
                        }
                    },
                ]
            }
        ]));
        bwin.webContents.on('did-finish-load', function () {
            //this.onReady();
        });
        bwin.webContents.on('did-fail-load', function (event, errCode, errDesc) {
            _this.onFail(errDesc);
        });
        /* Open external links in user's preferred browser rather than in Electron */
        bwin.webContents.on('new-window', function (event, url) {
            event.preventDefault();
            electron_1.shell.openExternal(url);
        });
        /* Don't change the window title */
        bwin.on('page-title-updated', function (event) {
            event.preventDefault();
        });
        this.browserWindow = bwin;
    };
    TeWindow.prototype.onFail = function (errDesc) {
        var bwin = this.browserWindow;
        if (!bwin.isDestroyed()) {
            bwin.loadURL(FILE_URL_FAILURE);
            //win.show();
        }
        //this.errorDesc = errDesc;
    };
    TeWindow.prototype.showPreferences = function () {
        var _this = this;
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
        this.prefsWin.on("closed", function () {
            _this.prefsWin = null;
            _this.browserWindow.focus();
        });
        this.prefsWin.loadURL(FILE_URL_PREFS);
    };
    return TeWindow;
}());
exports.TeWindow = TeWindow;
