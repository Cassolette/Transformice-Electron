import * as path from "path";
import * as url from "url";
import * as fs from "fs";
import * as http from "http";

const BASE_DIR = path.join(__dirname, "..");

const SERVER_TEST_PATH = "/TeServerTest";

/** 
 * Set up a local HTTP webserver which will respond with contents in /resources directory.
 * This is needed because flash refuses to send ExternalInterface calls when loading the
 * page directly from file://
 */
export async function startHttpServer() {
    var server = http.createServer((req, res) => {
        var urlobj = url.parse(req.url)
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
            } else {
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
};

/**
 * Tests if the specified local HTTP webserver is working.
 */
export async function testHttpServer(httpUrl: string) {
    return new Promise((resolve, reject) => {
        http.get(httpUrl + SERVER_TEST_PATH, (resp) => {
            if (resp.statusCode == 200) {
                resolve(true);
            } else {
                reject(false);
            }
        }).on("error", () => {
            reject(null);
        }).setTimeout(100);
    });
}
