import * as electronSets from "electron-settings";
import { TeWindow } from "./TeWindow";

const PATH_URL_TRANSFORMICE = "/tfm.html";

export class WindowTransformice extends TeWindow {
    protected windowTitle: string = "Transformice";
    protected windowBgColor: string = "#6A7495";
    protected windowWidth = 800;
    protected windowHeight = 600;

    constructor(httpUrl: string) {
        super();
        /* TODO: Find out if class properties can be overriden before constructor() is called.. */
        this._constructor(httpUrl);

        let is_win32 = process.platform == "win32"
        /* TFM Fullscreen event */
        this.ipc.on("tfm-fullscreen-mode", (event, mode) => {
            let bwin = this.browserWindow;
            // BUG: Workaround for Windows that fails maximize the window when recently clicked
            // within Flash Player. Setting a timeout of about 130s also works, but not reliably.
            // It is currently not known where or what the cause is.
            if (!mode) {
                if (is_win32) bwin.blur();
                bwin.setFullScreen(false);
                bwin.unmaximize();
                if (is_win32) bwin.focus();
            } else if (mode == 1) {
                if (is_win32) bwin.blur();
                bwin.maximize();
                if (is_win32) bwin.focus();
            }
        });
    }

    load() {
        /* Read alignment prefs */
        let align = electronSets.getSync("general.align") as string || "";
        let spl = align.split(",");
        if (spl.length >= 2) {
            let x = "";
            let y = "";

            switch (parseInt(spl[0], 10)) {
                case 1:
                    x = "l";
                    break;
                case 3:
                    x = "r";
                    break;
            }

            switch (parseInt(spl[1], 10)) {
                case 1:
                    y = "t";
                    break;
                case 3:
                    y = "b";
                    break;
            }

            align = y + x;
        } else {
            console.error("corrupt align prefs : " + align + electronSets.file());
        }

        this.browserWindow.loadURL(this.httpUrl + PATH_URL_TRANSFORMICE + "?align=" + align);
    }
}
