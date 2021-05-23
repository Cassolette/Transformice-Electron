import { app } from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";
import * as http from "http";

const BASE_DIR = path.join(__dirname, "..");
const SERVER_URL_FILE = path.join(app.getPath("userData"), "server.te");

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
        http.get(httpUrl + SERVER_TEST_PATH, { timeout: 100 }, (resp) => {
            if (resp.statusCode == 200) {
                resolve(true);
            } else {
                reject(false);
            }
        }).on('timeout', () => {
            reject(null);
        }).on('error', () => {
            reject(null);
        });
    });
}

/**
 * Retrieves a working HTTP server with checks to re-use any existing servers before starting a new one.
 * @param forceStart - Whether to perform the checks or simply start a new server
 */
export async function retrieveServer(forceStart?: boolean) {
    let stored_url = null;
    if (!forceStart) {
        try {
            let server_url = fs.readFileSync(SERVER_URL_FILE).toString();

            // Test if this server responds
            if (await testHttpServer(server_url)) {
                stored_url = server_url;
            }
        } catch (err) { }
    }

    if (stored_url) {
        console.log("Existing local HTTP server @ " + stored_url);
        return stored_url;
    } else {
        let http_url = await startHttpServer();
        // Store the current HTTP url asynchronously
        fs.writeFile(SERVER_URL_FILE, http_url, (err) => {
            if (err) {
                console.error("Failed to save TE server URL.");
            }
        });
        console.log("Set up local HTTP server @ " + http_url);
        return http_url;
    }
}