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
exports.newTEProcess = void 0;
const argparser_1 = require("./argparser");
const proc = __importStar(require("child_process"));
function newTEProcess(gameId) {
    let argp = new argparser_1.ArgpObject(process.argv);
    argp.setFlag("game-id", gameId.toString());
    let argv = argp.toArgv();
    let child_proc = proc.spawn(argv[0], argv.slice(1), {
        detached: true,
        stdio: 'inherit',
        windowsHide: false
    });
    child_proc.unref();
}
exports.newTEProcess = newTEProcess;
