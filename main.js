/* Load dependencies */
var electron = require("electron");
const { 
    app,
    ipcMain,
    BrowserWindow,
    Menu,
    MenuItem 
} = electron;
var path = require("path");
var url = require("url");
var fs = require("fs");

var FILE_BASE = "file://" + __dirname;

/* Fire a combined ready event when both app and server are ready */
var readyHandler = {};
(function(readyHandler) {
    var http_ready = false;
    var app_ready = false;
    var callback = null;
    var http_url = "";

    function fire() {
        if (http_ready && app_ready && callback)
            callback(http_url);
    }

    readyHandler.httpServerReady = function(httpUrl) {
        http_ready = true;
        http_url = httpUrl;
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
    var server = http.createServer(function (req, res) {
      //console.log(req.url)
      fs.readFile(path.join(__dirname, "resources", req.url), (err, contents) => {
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end(contents);
        })
    });
    /* Get an available port */
    const port = await require("get-port")();
    server.listen(port);
    console.log("Set up local HTTP server @ http://localhost:" + port);

    /* Signal HTTP server ready */
    readyHandler.httpServerReady("http://localhost:" + port);
})();

var win = null;
var loadingHandler = {};
(function(loadingHandler) {
    var URL_FAILURE = FILE_BASE + "/resources/failure.html";

    var errorDesc = null;

    loadingHandler.loadURL = function(url, show = true) {
        win.loadURL(url);
    }

    loadingHandler.onReady = function() {
        win.show();
    }

    loadingHandler.onFail = function(errDesc) {
        if (!win.isDestroyed()) {
            win.loadURL(URL_FAILURE);
            win.show();
        }
        errorDesc = errDesc;
    }

    loadingHandler.popErrorDesc = function() {
        var e = errorDesc || "Unknown error";
        errorDesc = null;
        return e;
    }

})(loadingHandler);

/* Load flash plugin according to platform */
{
    var pluginName
    switch (process.platform) {
      case 'win32':
        pluginName = "pepflashplayer64_32_0_0_433.dll";
        break
      case 'linux':
        pluginName = "libpepflashplayer64_29_0_0_171.so";
        break
    }

    console.log(pluginName)
    app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, "flash-plugin", pluginName))
    //app.commandLine.appendSwitch("ppapi-flash-version", "26.0.0.151");
}

/*** Event handlers for renderer calls to main */

/* TFM Fullscreen event */
ipcMain.on("tfm-full-screen", (event, mode) => {
    if (!mode) {
        win.setFullScreen(false);
    } else if (mode == 1) {
        win.maximize();
    }
});

/* Get error from loading */
ipcMain.on("should-send-error", (event) => {
    win.webContents.send('set-error', loadingHandler.popErrorDesc());
});

/* Shutdown before the app quits */
app.on('will-quit', () => {
    
});

/* Signal app ready */
app.whenReady().then(() => {
    readyHandler.appReady();
});

/* Initialise app */
readyHandler.then((httpUrl) => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: true,  /* show the default window frame (exit buttons, etc.) */
        //transparent: true,
        useContentSize: true,  /* make width & height relative to the content, not the whole window */
        show: false,
        //paintWhenInitiallyHidden: false,
        backgroundColor: "#6A7495",
        title: "Transformice",
        icon: path.join(__dirname, "resources/icon.png"),
        webPreferences: {
            plugins: true,
            sandbox: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    /* Build the menu */
    const menu = Menu.buildFromTemplate([
        {
          label: 'Zoom In',
          //accelerator: 'PageUp',
          click: () => {
            var webContents = win.webContents
            /* JS messes up when doing arithmetics against floats */
            var zoomFactor = Math.round(webContents.getZoomFactor() * 100 + 10) / 100;
            webContents.setZoomFactor(zoomFactor);
          }
        },
        {
          label: 'Zoom Out',
          //accelerator: 'PageDown',
          click: () => {
            var webContents = win.webContents
            /* JS messes up when doing arithmetics against floats */
            var zoomFactor = Math.round(webContents.getZoomFactor() * 100 - 10) / 100;
            if (zoomFactor > 0) webContents.setZoomFactor(zoomFactor);
          }
        },
        {
          label: 'Reset Zoom',
          //accelerator: 'PageDown',
          click: () => {
            var webContents = win.webContents
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
                  loadingHandler.loadURL(httpUrl + "/tfm.html", false);
              }
            },
            {
              label: 'Fullscreen',
              click: () => {
                  win.setFullScreen(!win.isFullScreen());
              }
            },
            {
              label: 'Fit Window',
              click: () => {
                  win.unmaximize();
                  win.setFullScreen(false);
                  win.setContentSize(800, 600);
              }
            },
            {
              label: 'DevTools',
              accelerator: 'Ctrl+Shift+I',
              click: () => {
                  win.webContents.openDevTools();
              }
            },
            ]
        }
    ]);

    win.setMenu(menu);

    loadingHandler.loadURL(httpUrl + "/tfm.html");

    win.webContents.on('did-finish-load', () => {
        loadingHandler.onReady();
    });

    win.webContents.on('did-fail-load', (event, errCode, errDesc) => {
        loadingHandler.onFail(errDesc);
    });

    /* Open external links in user's preferred browser rather than in Electron */
    win.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        electron.shell.openExternal(url);
    });

    /* Don't change the window title */
    win.on('page-title-updated', (event) => {
        event.preventDefault();
    });

});
