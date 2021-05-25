"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgpObject = void 0;
const REGEX_FLAG = /^--([^=\s]+)=?"?(.*?)"?$/m;
class ArgpArg {
}
class ArgpArgNormal extends ArgpArg {
    constructor() {
        super(...arguments);
        this.value = "";
    }
    needsQuotes() {
        return this.value.includes(" ");
    }
}
class ArgpArgFlag extends ArgpArg {
    constructor() {
        super(...arguments);
        this.name = "";
    }
    needsQuotes() {
        return this.value != null && this.value.includes(" ");
    }
}
class ArgpObject {
    constructor(argv) {
        this.args = [];
        this.flagsDict = {};
        for (let i = 0; i < argv.length; i++) {
            let m;
            if (m = REGEX_FLAG.exec(argv[i])) {
                let f = new ArgpArgFlag;
                f.name = m[1];
                f.value = m[2];
                this.flagsDict[f.name] = f;
                this.args.push(f);
            }
            else {
                let n = new ArgpArgNormal;
                n.value = argv[i];
                this.args.push(n);
            }
        }
    }
    setFlag(name, value) {
        let f;
        if (f = this.flagsDict[name]) {
            f.value = value;
        }
        else {
            let f = new ArgpArgFlag;
            f.name = name;
            f.value = value;
            this.flagsDict[f.name] = f;
            this.args.push(f);
        }
    }
    getFlag(name) {
        let f = this.flagsDict[name];
        return f != null ? (f.value ? f.value : true) : false;
    }
    toArgv() {
        let ret = [];
        this.args.forEach((arg) => {
            if (arg instanceof ArgpArgNormal) {
                let n = arg;
                let q = n.needsQuotes() ? '"' : "";
                ret.push(q + n.value + q);
            }
            else if (arg instanceof ArgpArgFlag) {
                let f = arg;
                let str = "--" + f.name;
                if (f.value != null) {
                    let q = f.needsQuotes() ? '"' : "";
                    str += "=" + q + f.value + q;
                }
                ret.push(str);
            }
        });
        return ret;
    }
}
exports.ArgpObject = ArgpObject;
