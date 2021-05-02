"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.testHttpServer = exports.startHttpServer = void 0;
var path = require("path");
var url = require("url");
var fs = require("fs");
var http = require("http");
var BASE_DIR = path.join(__dirname, "..");
var SERVER_TEST_PATH = "/TeServerTest";
/**
 * Set up a local HTTP webserver which will respond with contents in /resources directory.
 * This is needed because flash refuses to send ExternalInterface calls when loading the
 * page directly from file://
 */
function startHttpServer() {
    return __awaiter(this, void 0, void 0, function () {
        var server, port;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    server = http.createServer(function (req, res) {
                        var urlobj = url.parse(req.url);
                        var pathname = urlobj.pathname;
                        res.setTimeout(5000);
                        /* Connectivity test */
                        if (pathname == SERVER_TEST_PATH) {
                            res.writeHead(200);
                            res.end(SERVER_TEST_PATH);
                            return;
                        }
                        fs.readFile(path.join(BASE_DIR, "resources", pathname), function (err, contents) {
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
                    return [4 /*yield*/, require("get-port")()];
                case 1:
                    port = _a.sent();
                    server.listen(port);
                    /* Disable TCP delay */
                    server.on("connection", function (socket) {
                        socket.setNoDelay(true);
                    });
                    /* Signal HTTP server ready */
                    return [2 /*return*/, "http://localhost:" + port];
            }
        });
    });
}
exports.startHttpServer = startHttpServer;
;
/**
 * Tests if the specified local HTTP webserver is working.
 */
function testHttpServer(httpUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    http.get(httpUrl + SERVER_TEST_PATH, function (resp) {
                        if (resp.statusCode == 200) {
                            resolve(true);
                        }
                        else {
                            reject(false);
                        }
                    }).on("error", function () {
                        reject(null);
                    }).setTimeout(100);
                })];
        });
    });
}
exports.testHttpServer = testHttpServer;
