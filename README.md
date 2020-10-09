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

If you'd like to package this as a Desktop application, run the following command:
```
npm run-script ${package}
```

Where `${package}` targets the platform and architecture:
* `winpkg64` – Windows
* `macpkg64` – MacOS (Darwin)
* `lnxpkg64` – Linux

You may create your own build targets in `package.json` under `scripts`.

The packaged application will be created under `dist/Transformice-<platform>-<arch>`. The executable can then be pinned to your start menu as you like.

### Others
Report bugs to the Issues tab of this repository. Contributions through pull requests are also welcome!
