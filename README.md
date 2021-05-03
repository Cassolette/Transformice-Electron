## Transformice-Electron
### Building & Installation
You will need to install [Node.js](https://nodejs.org/). After that, clone this repository and run the following commands. This will install the required Node.js dependencies needed to build this application.

```
cd Transformice-Electron
npm install
```

You can then run the app directly from the command line:

```
npm start
```
On Linux, you may hit an error with "Can't load plugin" when running the app via `npm start`. Instead, you may want to try `npm run startnsb`, which launches Electron without the [Chromium sandbox](https://chromium.googlesource.com/chromium/src/+/master/docs/design/sandbox.md). Be aware that this can have adverse effects on security, however.

If you'd like to package this as a Desktop application, run the following command:
```
npm run ${package}
```

Where `${package}` targets the platform and architecture:
* `build` – Current host platform
* `buildwin` – Windows
* `buildmac` – MacOS (Darwin)
* `buildlnx` – Linux
* `buildall` – All platforms

You may create or customise your own build targets in `package.json`. The packaged application will be created under `dist/`.

### Cross platform distribution
To avoid errors when building cross platform distributions, you may want to build from the same platform as the target platform.

#### Building from Linux
As of now only Linux is known to work best when targetting cross-platform builds.

When building a package for Windows, `wine` is [required](https://www.electron.build/multi-platform-build#linux). You may obtain it by using `apt`:
```
sudo apt install wine
```

### Installing on Linux
By default the Linux distribution of the app is packaged using `snap`. On newer Ubuntu distros, snap is installed by default. If otherwise please install it before you install the app.

To install the .snap file you'd need to pass a `--dangerous` command line argument to snap (since this app comes from an untrusted source). For the sake of security, you may want to build the app yourself before passing `--dangerous` carelessly.

### Others
Report bugs to the Issues tab of this repository. Contributions through pull requests are also welcome!
