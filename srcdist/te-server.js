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
exports.retrieveServer = exports.testHttpServer = exports.startHttpServer = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
const BASE_DIR = path.join(__dirname, "..");
const SERVER_URL_FILE = path.join(electron_1.app.getPath("userData"), "server.te");
const SERVER_TEST_PATH = "/TeServerTest";
async function startHttpServer() {
    var server = http.createServer((req, res) => {
        var urlobj = url.parse(req.url);
        var pathname = urlobj.pathname;
        res.setTimeout(5000);
        if (pathname == SERVER_TEST_PATH) {
            res.writeHead(200);
            res.end(SERVER_TEST_PATH);
            return;
        }
        fs.readFile(path.join(BASE_DIR, "resources", pathname), (err, contents) => {
            if (err) {
                res.writeHead(400);
                res.end("Error: Could not load");
            }
            else {
                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                res.end(contents);
            }
        });
    });
    const port = await require("get-port")();
    server.listen(port);
    server.on("connection", (socket) => {
        socket.setNoDelay(true);
    });
    return "http://localhost:" + port;
}
exports.startHttpServer = startHttpServer;
;
async function testHttpServer(httpUrl) {
    return new Promise((resolve, reject) => {
        http.get(httpUrl + SERVER_TEST_PATH, { timeout: 100 }, (resp) => {
            if (resp.statusCode == 200) {
                resolve(true);
            }
            else {
                reject(false);
            }
        }).on('timeout', () => {
            reject(null);
        }).on('error', () => {
            reject(null);
        });
    });
}
exports.testHttpServer = testHttpServer;
async function retrieveServer(forceStart) {
    let stored_url = null;
    if (!forceStart) {
        try {
            let server_url = fs.readFileSync(SERVER_URL_FILE).toString();
            if (await testHttpServer(server_url)) {
                stored_url = server_url;
            }
        }
        catch (err) { }
    }
    if (stored_url) {
        console.log("Existing local HTTP server @ " + stored_url);
        return stored_url;
    }
    else {
        let http_url = await startHttpServer();
        fs.writeFile(SERVER_URL_FILE, http_url, (err) => {
            if (err) {
                console.error("Failed to save TE server URL.");
            }
        });
        console.log("Set up local HTTP server @ " + http_url);
        return http_url;
    }
}
exports.retrieveServer = retrieveServer;
