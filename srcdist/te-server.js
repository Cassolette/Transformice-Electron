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
exports.testHttpServer = exports.startHttpServer = void 0;
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
const BASE_DIR = path.join(__dirname, "..");
const SERVER_TEST_PATH = "/TeServerTest";
/**
 * Set up a local HTTP webserver which will respond with contents in /resources directory.
 * This is needed because flash refuses to send ExternalInterface calls when loading the
 * page directly from file://
 */
async function startHttpServer() {
    var server = http.createServer((req, res) => {
        var urlobj = url.parse(req.url);
        var pathname = urlobj.pathname;
        res.setTimeout(5000);
        /* Connectivity test */
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
    /* Get an available port */
    const port = await require("get-port")();
    server.listen(port);
    /* Disable TCP delay */
    server.on("connection", (socket) => {
        socket.setNoDelay(true);
    });
    /* Signal HTTP server ready */
    return "http://localhost:" + port;
}
exports.startHttpServer = startHttpServer;
;
/**
 * Tests if the specified local HTTP webserver is working.
 */
async function testHttpServer(httpUrl) {
    return new Promise((resolve, reject) => {
        http.get(httpUrl + SERVER_TEST_PATH, (resp) => {
            if (resp.statusCode == 200) {
                resolve(true);
            }
            else {
                reject(false);
            }
        }).on("error", () => {
            reject(null);
        }).setTimeout(100);
    });
}
exports.testHttpServer = testHttpServer;
