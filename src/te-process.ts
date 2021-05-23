import { ArgpObject } from "./argparser";
import { TeGames } from "./te-enums";
import * as proc from "child_process";

export function newTEProcess(gameId: TeGames) {
    let argp = new ArgpObject(process.argv);
    argp.setFlag("game-id", gameId.toString());

    let argv = argp.toArgv();
    let child_proc = proc.spawn(argv[0], argv.slice(1), {
        detached: true,     // Let the child continue to run even when this process exits
        stdio: 'inherit',    // Set to 'inherit' to have the child's stdio route to this process' (useful for debugging), 'ignore' otherwise
        windowsHide: false  // We want to show the window, duh.
    });
    child_proc.unref();
}
