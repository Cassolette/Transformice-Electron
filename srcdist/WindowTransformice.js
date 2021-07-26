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
exports.WindowTransformice = void 0;
const electronSets = __importStar(require("electron-settings"));
const TeWindow_1 = require("./TeWindow");
const PATH_URL_TRANSFORMICE = "/tfm.html";
class WindowTransformice extends TeWindow_1.TeWindow {
    constructor(httpUrl) {
        super();
        this.windowTitle = "Transformice";
        this.windowBgColor = "#6A7495";
        this.windowWidth = 800;
        this.windowHeight = 600;
        this._constructor(httpUrl);
        let _this = this;
        this.ipc.on("tfm-fullscreen-mode", (event, mode) => {
            let bwin = _this.browserWindow;
            if (!mode) {
                bwin.setFullScreen(false);
            }
            else if (mode == 1) {
                bwin.maximize();
            }
        });
    }
    load() {
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
        }
        else {
            console.error("corrupt align prefs : " + align + electronSets.file());
        }
        this.browserWindow.loadURL(this.httpUrl + PATH_URL_TRANSFORMICE + "?align=" + align);
    }
}
exports.WindowTransformice = WindowTransformice;
