"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowDeadMaze = void 0;
const TeWindow_1 = require("./TeWindow");
const PATH_URL_DEADMAZE = "/deadmaze.html";
class WindowDeadMaze extends TeWindow_1.TeWindow {
    constructor(httpUrl) {
        super();
        this.windowTitle = "DeadMaze";
        this.windowBgColor = "#000000";
        this.windowWidth = 1044;
        this.windowHeight = 632;
        this._constructor(httpUrl);
    }
    load() {
        this.browserWindow.loadURL(this.httpUrl + PATH_URL_DEADMAZE);
    }
}
exports.WindowDeadMaze = WindowDeadMaze;
