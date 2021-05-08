const REGEX_FLAG = /^--([^=\s]+)=?"?(.*?)"?$/m;

abstract class ArgpArg {
    abstract needsQuotes(): boolean;
}

class ArgpArgNormal extends ArgpArg {
    public value: string = "";

    needsQuotes(): boolean {
        return this.value.includes(" ");
    }
}

class ArgpArgFlag extends ArgpArg {
    public name: string = "";
    public value: string | null;

    needsQuotes(): boolean {
        return this.value != null && this.value.includes(" ");
    }
}

/** Simple Chromium v8 cmdline parser */
export class ArgpObject {
    private args: ArgpArg[] = [];
    private flagsDict: { [key: string]: ArgpArgFlag } = {};

    constructor(argv: string[]) {
        for (let i = 0; i < argv.length; i++) {
            let m;
            if (m = REGEX_FLAG.exec(argv[i])) {
                let f = new ArgpArgFlag;

                f.name = m[1];
                f.value = m[2];
                this.flagsDict[f.name] = f;

                this.args.push(f);
            } else {
                let n = new ArgpArgNormal;
                n.value = argv[i];
                this.args.push(n);
            }
        }
    }

    public setFlag(name: string, value: string) {
        let f: ArgpArgFlag;
        if (f = this.flagsDict[name]) {
            // Existing
            f.value = value;
        } else {
            // Append
            let f = new ArgpArgFlag;

            f.name = name;
            f.value = value;
            this.args.push(f);
        }
    }

    public getFlag(name: string) : string|boolean {
        let f = this.flagsDict[name];
        return f != null ? (f.value ? f.value : true) : false;
    }

    public toArgv(): string[] {
        let ret: string[] = [];

        this.args.forEach((arg) => {
            if (arg instanceof ArgpArgNormal) {
                let n = arg as ArgpArgNormal;
                let q = n.needsQuotes() ? '"' : "";
                ret.push(q + n.value + q);
            } else if (arg instanceof ArgpArgFlag) {
                let f = arg as ArgpArgFlag;
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
