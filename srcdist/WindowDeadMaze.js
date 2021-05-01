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
exports.WindowDeadMaze = void 0;
var TeWindow_1 = require("./TeWindow");
var PATH_URL_DEADMAZE = "/deadmaze.html";
var WindowDeadMaze = /** @class */ (function (_super) {
    __extends(WindowDeadMaze, _super);
    function WindowDeadMaze(httpUrl) {
        var _this = _super.call(this) || this;
        _this.windowTitle = "DeadMaze";
        _this.windowBgColor = "#000000";
        /* TODO: Find out if class properties can be overriden before constructor() is called.. */
        _this._constructor(httpUrl);
        return _this;
    }
    WindowDeadMaze.prototype.load = function () {
        this.browserWindow.maximize();
        this.browserWindow.loadURL(this.httpUrl + PATH_URL_DEADMAZE);
    };
    return WindowDeadMaze;
}(TeWindow_1.TeWindow));
exports.WindowDeadMaze = WindowDeadMaze;
