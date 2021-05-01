import * as path from "path";
import * as url from "url";
import * as fs from "fs";
import * as http from "http";

const BASE_DIR = path.join(__dirname, "..");

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
    console.log("Set up local HTTP server @ http://localhost:" + port);

    /* Disable TCP delay */
    server.on("connection", (socket) => {
        socket.setNoDelay(true);
    });

    /* Signal HTTP server ready */
    return "http://localhost:" + port;
};
