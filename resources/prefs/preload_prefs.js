var electronSets = require("electron-settings");
var fs = require("fs");
var path = require("path");

window.electron = {
    readFile: (filename, cb) => {
        return fs.readFile(path.join(__dirname, filename), cb);
    },
    electronSets: electronSets
};
