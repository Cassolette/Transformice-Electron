import { TeWindow } from "./TeWindow";

const PATH_URL_DEADMAZE = "/deadmaze.html";

export class WindowDeadMaze extends TeWindow {
    protected windowTitle: string = "DeadMaze";
    protected windowBgColor: string = "#000000";
    protected windowWidth = 1044;
    protected windowHeight = 632;

    constructor(httpUrl: string) {
        super();
        /* TODO: Find out if class properties can be overriden before constructor() is called.. */
        this._constructor(httpUrl);
    }

    load() {
        this.browserWindow.loadURL(this.httpUrl + PATH_URL_DEADMAZE);
    }
}
