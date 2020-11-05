/* Load dependencies */
const electron = require("electron");
const {
    app,
    ipcMain,
    BrowserWindow,
    Menu,
    MenuItem,
    dialog
} = electron;
const path = require("path");
const url = require("url");
const fs = require("fs");
const electronSets = require("electron-settings");

const FILE_BASE = "file://" + __dirname;
const APP_NAME = "Transformice";

var httpUrl = null;

/* Ensure that only a single instance of the app is running */
{
    let instance_lock = app.requestSingleInstanceLock();
    if (!instance_lock) {
        /*
         * Client tried to open a second instance - close the app and signal
         * 'second-instance' to the running instance.
         */
        app.quit();
    } else {
        initApp();
    }
}

function initApp() {

    /* Fire a combined ready event when both app and server are ready */
    var readyHandler = {};
    (function(readyHandler) {
        var http_ready = false;
        var app_ready = false;
        var callback = null;

        function fire() {
            if (http_ready && app_ready && callback)
                callback();
        }

        readyHandler.httpServerReady = function(http_url) {
            httpUrl = http_url;
            http_ready = true;
            fire();
        }

        readyHandler.appReady = function() {
            app_ready = true;
            fire();
        }

        readyHandler.then = function(cb) {
            if (cb instanceof Function)
                callback = cb;
        }
    })(readyHandler);

    /*
     * Set up a local HTTP webserver which will respond with contents in /resources directory.
     * This is needed because flash refuses to send ExternalInterface calls when loading the
     * page directly from file://
     *
     */
    (async function() {
        var http = require("http");
        var server = http.createServer((req, res) => {
            var urlobj = url.parse(req.url)
            var pathname = urlobj.pathname;
            var query = urlobj.query;
            //console.log(pathname + (query ? "?" + query : ""))

            res.setTimeout(5000);

            // HACK to load DeadMaze by channeling the SWF binary buffers from the actual site
            if (pathname == "/deadmeat.swf") {
                http.get("http://deadmaze.com/alpha/deadmeat.swf?" + query, (resp) => {
                    let rawHeaders = resp.rawHeaders;
                    for (let i = 0; i < rawHeaders.length; i += 2) {
                        res.setHeader(rawHeaders[i], rawHeaders[i + 1]);
                    }
                    //console.log(res.getHeaders())

                    resp.on("data", (chunk) => {
                        res.write(chunk);
                    });
                    resp.on("end", () => {
                        res.end();
                    });
                }).on("error", (err) => {
                    res.writeHead(500);
                    res.end();
                });
            } else {
                fs.readFile(path.join(__dirname, "resources", pathname), (err, contents) => {
                    if (err) {
                        res.writeHead(404);
                        res.end();
                    } else {
                        res.setHeader("Content-Type", "text/html");
                        res.writeHead(200);
                        res.end(contents);
                    }
                });
            }
        });

        /* Get an available port */
        const port = await require("get-port")();
        server.listen(port);
        console.log("Set up local HTTP server @ http://localhost:" + port);

        /* Disable TCP delay */
        server.on("connection", (socket) => {
            socket.setNoDelay(true);
        });

        /* Signal HTTP server ready */
        readyHandler.httpServerReady("http://localhost:" + port);
    })();

    /* Load flash plugin according to platform */
    {
        let pluginName
        let iden
        switch (process.platform) {
            case 'win32':
                iden = "win";
                pluginName = "pepflashplayer64_32_0_0_445.dll";
                break;
            case 'linux':
                iden = "lnx";
                pluginName = "libpepflashplayer64_32_0_0_445.so";
                break;
            case 'darwin':
                iden = "mac";
                pluginName = "PepperFlashPlayer.plugin";
                break;
        }

        console.log(pluginName || "No plugin found.")

        /* Flash plugin can only be loaded when unpacked. */
        app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, "flash-plugin", iden, pluginName)
            .replace('app.asar', 'app.asar.unpacked'));
        //app.commandLine.appendSwitch("ppapi-flash-version", "26.0.0.151");
    }

    app.on('second-instance', (event, cmdLine, workingDir) => {
        /* Open a new window */
        (new Window801(Window801.GAME_TRANSFORMICE)).load();
    });

    /* Signal app ready */
    app.whenReady().then(() => {
        readyHandler.appReady();
    });

    var Window801 = {};
    (function() {
        const FILE_URL_FAILURE = FILE_BASE + "/resources/failure.html";
        const FILE_URL_PREFS = FILE_BASE + "/resources/prefs/prefs.html";
        const PATH_URL_TRANSFORMICE = "/tfm.html";
        const PATH_URL_DEADMAZE = "/deadmaze.html";

        /** Window801 local private functions **/
        /* Build the menu, call with context from Window801 instance */
        function buildMenu(bwin) {
            return Menu.buildFromTemplate([
            {
                label: 'Zoom In',
                //accelerator: 'PageUp',
                click: () => {
                    var webContents = bwin.webContents;
                    /* JS messes up when doing arithmetics against floats */
                    var zoomFactor = Math.round(webContents.getZoomFactor() * 100 + 10) / 100;
                    webContents.setZoomFactor(zoomFactor);
                }
            },
            {
                label: 'Zoom Out',
                //accelerator: 'PageDown',
                click: () => {
                    var webContents = bwin.webContents;
                    /* JS messes up when doing arithmetics against floats */
                    var zoomFactor = Math.round(webContents.getZoomFactor() * 100 - 10) / 100;
                    if (zoomFactor > 0) webContents.setZoomFactor(zoomFactor);
                }
            },
            {
                label: 'Reset Zoom',
                //accelerator: 'PageDown',
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
                        (new Window801(Window801.GAME_TRANSFORMICE)).load();
                    }
                },
                {
                    label: 'DeadMaze',
                    click: () => {
                        (new Window801(Window801.GAME_DEADMAZE)).load();
                    }
                },
                ]
            }]);
        }

        /** Window801 local private static vars **/
        var windows = {};
        var windowsByWebContents = {};

        /* Window801 constructor */
        Window801 = function(gameType) {
            /* Initialize BrowserWindow */
            let bwin = new BrowserWindow({
                width: 800,
                height: 600,
                frame: true,
                /* show the default window frame (exit buttons, etc.) */
                //transparent: true,
                useContentSize: true,
                /* make width & height relative to the content, not the whole window */
                show: true,
                /* show app background instantly until content is loaded */
                //paintWhenInitiallyHidden: false,
                backgroundColor: "#6A7495",
                title: APP_NAME,
                icon: path.join(__dirname, "resources", "icon.png"),
                webPreferences: {
                    plugins: true,
                    sandbox: true,
                    preload: path.join(__dirname, "preload.js")
                }
            });

            bwin.setMenu(buildMenu.call(this, bwin));

            bwin.webContents.on('did-finish-load', () => {
                this.onReady();
            });

            bwin.webContents.on('did-fail-load', (event, errCode, errDesc) => {
                this.onFail(errDesc);
            });

            /* Open external links in user's preferred browser rather than in Electron */
            bwin.webContents.on('new-window', (event, url) => {
                event.preventDefault();
                electron.shell.openExternal(url);
            });

            /* Don't change the window title */
            bwin.on('page-title-updated', (event) => {
                event.preventDefault();
            });

            let wid = bwin.id;
            let wcid = bwin.webContents.id;
            /* Delete reference on close */
            bwin.on('closed', (event) => {
                windows[wid] = null;
                windowsByWebContents[wcid] = null;
            });

            this.browserWindow = bwin;
            this.id = bwin.id;
            this.gameType = gameType;
            this.prefsWin = null;
            this.errorDesc = null;

            windows[this.id] = this;
            windowsByWebContents[bwin.webContents.id] = this;
        }

        /** Window801 public **/
        Window801.prototype.load = function() {
            if (this.gameType == Window801.GAME_TRANSFORMICE) {
                /* Read alignment prefs */
                let align = electronSets.getSync("general.align") || "";
                let spl = align.split(",");
                if (spl.length >= 2) {
                    let x = "";
                    let y = "";

                    switch (parseInt(spl[0], 10)) {
                        case 1:
                            x = "l";
                            break;
                        case 3:
                            x = "r";
                            break;
                    }

                    switch (parseInt(spl[1], 10)) {
                        case 1:
                            y = "t";
                            break;
                        case 3:
                            y = "b";
                            break;
                    }

                    align = y + x;
                } else {
                    console.log("corrupt align prefs : " + align + electronSets.file());
                }

                /* Load it */
                this.browserWindow.loadURL((httpUrl || "") + PATH_URL_TRANSFORMICE + "?align=" + align);
            } else if (this.gameType == Window801.GAME_DEADMAZE) {
                this.browserWindow.setTitle("DeadMaze");
                this.browserWindow.setBackgroundColor("#000000");
                this.browserWindow.maximize();
                this.browserWindow.loadURL((httpUrl || "") + PATH_URL_DEADMAZE);
            }
        }

        Window801.prototype.onReady = function() {
            //this.browserWindow.show();
        }

        Window801.prototype.onFail = function(errDesc) {
            let win = this.browserWindow;
            if (!win.isDestroyed()) {
                win.loadURL(FILE_URL_FAILURE);
                //win.show();
            }
            this.errorDesc = errDesc;
        }

        Window801.prototype.popErrorDesc = function() {
            var e = this.errorDesc || "Unknown error";
            errorDesc = null;
            return e;
        }

        Window801.prototype.showPreferences = function() {
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
                icon: path.join(__dirname, "resources", "icon.png"),
                parent: this.browserWindow,
                webPreferences: {
                    plugins: true,
                    //sandbox: true,
                    enableRemoteModule: true,
                    preload: path.join(__dirname, "resources", "prefs", "preload_prefs.js")
                }
            });

            this.prefsWin.on("closed", () => {
                this.prefsWin = null;
                this.browserWindow.focus();
            });

            this.prefsWin.loadURL(FILE_URL_PREFS);
        }

        Window801.getWindowById = function(id) {
            return windows[id];
        }

        Window801.getWindowByWebContentsId = function(id) {
            return windowsByWebContents[id];
        }

        /* Game enums */
        Window801.GAME_TRANSFORMICE = 1;
        Window801.GAME_DEADMAZE = 2;
        Window801.GAME_BOUBOUM = 3;
        Window801.GAME_FORTORESSE = 4;
        Window801.GAME_NEKODANCER = 5;

    })();

    /*** Event handlers for renderer calls to main */

    /* TFM Fullscreen event */
    ipcMain.on("tfm-full-screen", (event, mode) => {
        let win801 = Window801.getWindowByWebContentsId(event.sender.id);
        if (win801) {
            if (!mode) {
                win801.browserWindow.setFullScreen(false);
            } else if (mode == 1) {
                win801.browserWindow.maximize();
            }
        }
    });

    /* Get error from loading */
    ipcMain.on("should-send-error", (event) => {
        let win801 = Window801.getWindowByWebContentsId(event.sender.id);
        if (win801) {
            event.reply('set-error', win801.popErrorDesc());
        }
    });

    /* Initialise app */
    readyHandler.then(() => {
        (new Window801(Window801.GAME_TRANSFORMICE)).load();
    });
}
