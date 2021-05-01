import * as electronSets from "electron-settings";
import { TeWindow } from "./TeWindow";

const PATH_URL_TRANSFORMICE = "/tfm.html";

export class WindowTransformice extends TeWindow {
    protected windowTitle: string = "Transformice";
    protected windowBgColor: string = "#6A7495";

    constructor(httpUrl: string) {
        super();
        /* TODO: Find out if class properties can be overriden before constructor() is called.. */
        this._constructor(httpUrl);
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
            console.log("corrupt align prefs : " + align + electronSets.file());
        }

        this.browserWindow.loadURL(this.httpUrl + PATH_URL_TRANSFORMICE + "?align=" + align);
    }
}
