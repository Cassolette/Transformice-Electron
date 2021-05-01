"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.WindowTransformice = void 0;
var electron_1 = require("electron");
var electronSets = require("electron-settings");
var TeWindow_1 = require("./TeWindow");
var PATH_URL_TRANSFORMICE = "/tfm.html";
var WindowTransformice = /** @class */ (function (_super) {
    __extends(WindowTransformice, _super);
    function WindowTransformice(httpUrl) {
        var _this_1 = _super.call(this) || this;
        _this_1.windowTitle = "Transformice";
        _this_1.windowBgColor = "#6A7495";
        /* TODO: Find out if class properties can be overriden before constructor() is called.. */
        _this_1._constructor(httpUrl);
        var _this = _this_1;
        /* TFM Fullscreen event */
        electron_1.ipcMain.on("tfm-fullscreen-mode", function (event, mode) {
            var bwin = _this.browserWindow;
            if (bwin.webContents.id == event.sender.id) {
                if (!mode) {
                    bwin.setFullScreen(false);
                }
                else if (mode == 1) {
                    bwin.maximize();
                }
            }
        });
        return _this_1;
    }
    WindowTransformice.prototype.load = function () {
        /* Read alignment prefs */
        var align = electronSets.getSync("general.align") || "";
        var spl = align.split(",");
        if (spl.length >= 2) {
            var x = "";
            var y = "";
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
        }
        else {
            console.log("corrupt align prefs : " + align + electronSets.file());
        }
        this.browserWindow.loadURL(this.httpUrl + PATH_URL_TRANSFORMICE + "?align=" + align);
    };
    return WindowTransformice;
}(TeWindow_1.TeWindow));
exports.WindowTransformice = WindowTransformice;
