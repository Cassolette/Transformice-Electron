import * as proc from "child_process";
import { TeGames } from "./te-enums";

export function newTEProcess(gameId: TeGames) {
    let child_proc = proc.spawn(process.argv[0], [ process.argv[1], gameId.toString() ], {
        detached: true,     // Let the child continue to run even when this process exits
        stdio: 'ignore',    // Set to 'inherit' to have the child's stdio route to this process' (useful for debugging), 'ignore' otherwise
        windowsHide: false  // We want to show the window, duh.
    });
    child_proc.unref();
}
