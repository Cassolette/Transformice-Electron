const fs = require("fs");
const path = require("path");

window.exports = {
    readFile: function (filename, cb) {
        fs.readFile(path.join(__dirname, filename), cb);
    },
    electronSets: require("electron-settings"),
};
