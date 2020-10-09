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

var win = null;
var loadingWin = {};
(function(loadingWin) {
    var FILE_BASE = "file://" + __dirname;
    var URL_LOADING = FILE_BASE + "/resources/loading.html";
    var URL_FAILURE = FILE_BASE + "/resources/failure.html";

    var loading_bw = null;
    var errorDesc = null;

    loadingWin.createWindow = function() {
        loading_bw = new BrowserWindow({
            width: 400,
            height: 80,
            show: false,
            frame: false
        });
    }

    loadingWin.closeWindow = function() {
        loading_bw.destroy();
    }

    loadingWin.loadURL = function(url) {
        win.loadURL(url);
        win.hide();
        loading_bw.loadURL(URL_LOADING);
        loading_bw.show();
    }

    loadingWin.onReady = function() {
        loading_bw.hide();
        win.show();
    }

    loadingWin.onFail = function(errDesc) {
        if (!loading_bw.isDestroyed() && !win.isDestroyed()) {
            loading_bw.hide();
            win.loadURL(URL_FAILURE);
            win.show();
        }
        errorDesc = errDesc;
    }

    loadingWin.popErrorDesc = function() {
        var e = errorDesc || "Unknown error";
        errorDesc = null;
        return e;
    }

})(loadingWin);

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
    }
});

/* TFM Window ready to show */
ipcMain.on("tfm-ready-to-show", (event) => {
    loadingWin.onReady();
});

/* Get error from loading */
ipcMain.on("should-send-error", (event) => {
    win.webContents.send('set-error', loadingWin.popErrorDesc());
});

/* Close all apps */
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

/* Initialise app */
app.whenReady().then(() => {
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

    loadingWin.createWindow();

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
                  win.hide();
                  loadingWin.loadURL("http://transformice.com");
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

    loadingWin.loadURL("http://transformice.com");

    win.webContents.on('did-finish-load', () => {
        var hostname = url.parse(win.webContents.getURL()).hostname;
        if (hostname.includes("transformice.com")) {
            //win.webContents.executeJavaScript('console.log("'+url.parse(win.webContents.getURL()).hostname+'")');
            win.webContents.setZoomFactor(1);
            /* Inject js to renderer */
            win.webContents.executeJavaScript(
                    `
                    var ipc = window.ipcRenderer;
                    function pleinEcran(OUI) {
                        ipc.send("tfm-full-screen", OUI)
                    }
                    document.getElementById("transformice").style.position="fixed";
                    document.getElementById("transformice").style.left="0";
                    document.getElementById("transformice").style.top="0";
                    document.getElementById("transformice").style.width="100%";
                    document.getElementById("transformice").style.height="100%";
                    
                    
                    document.getElementById("idPub").style.display="none";
                    //document.getElementById("fb-comments").style.display="none";
                    document.body.style.overflow = 'hidden';

                    ipc.send("tfm-ready-to-show")
                    `
                ).catch(error => {});
            
        } else {
            /* Ignored for tfm, that will trigger tfm-ready-to-show when needed */
            loadingWin.onReady();
        }
    });

    win.webContents.on('did-fail-load', (event, errCode, errDesc) => {
        loadingWin.onFail(errDesc);
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

    /* For now we assume that only one window can exist, therefore this means that the app must close */
    win.on('closed', () => {
        loadingWin.closeWindow();
    });

});
