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
* `buildwin` – Windows
* `buildmac` – MacOS (Darwin)
* `buildlnx` – Linux

You may create or customise your own build targets in `package.json`. The packaged application will be created under `dist/`.

### Others
Report bugs to the Issues tab of this repository. Contributions through pull requests are also welcome!
