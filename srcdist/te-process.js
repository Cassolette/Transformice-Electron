"use strict";
exports.__esModule = true;
exports.newTEProcess = void 0;
var proc = require("child_process");
function newTEProcess(gameId) {
    var child_proc = proc.spawn(process.argv[0], [process.argv[1], gameId.toString()], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false // We want to show the window, duh.
    });
    child_proc.unref();
}
exports.newTEProcess = newTEProcess;
