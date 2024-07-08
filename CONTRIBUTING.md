# Contributing to Magrit

## Development process

Development of Magrit is done in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving Magrit.

Also note that the development is done first in the `dev` branch which is then merged into the `main` branch when a new version is released.

In consequence, if you want to contribute to the project, you should fork the repository and create a pull request to the `dev` branch.

## Reporting issues

To report a bug or to suggest some enhancements, don't hesitate to create a issue on the dedicated bug tracker on github: https://github.com/riatelab/magrit/issues.

## Repository structure

The repository roughly is structured as follows:

```
magrit/
├── docs/                    # Documentation in French
|   ├── en/                  # Documentation in english
|   └── .vitepress/          # Configuration of the documentation
├── electron/                # Electron configuration
├── src/                     # Source code of the application
|   ├── assets/              # Static assets
|   ├── components/          # Components of the application
|   ├── helpers/             # Helper functions
|   ├── i18n/                # Translation files
|   ├── public/dataset/      # Example datasets
|   ├── store/               # Stores of the application
|   ├── styles/              # Styles of the application
|   ├── vendor/              # Vendored libraries (only GPU.js)
|   ├── AppPage.tsx          # Main component of the application
|   └── index.tsx            # Entry point of the application
├── electron-builder.json5   # Configuration of the electron builder
├── package.json             # Dependencies of the application and build scripts
└── vite.config.ts           # Configuration of the vite bundler 
```

## Contributing code

The source code is located in the `src` folder.
It is written in TypeScript and uses the Solid.js library for the user interface.

It uses the `npm` package manager to manage dependencies (except for the vendored libraries which are stored in the `vendor` folder),
the `vite` bundler to build the code of the application
and `electron-builder` to package the application for Windows and GNU/Linux (and soon MacOS).

While awaiting for more detailed information about the architecture of the application, you can 
contact us by opening an issue on the github repository if needed.

## Updating existing translation strings for the application

The application's translation files are located in `the src/i18n` folder.
If you notice any spelling mistakes or wrong phrasing, you can correct them here.

## Updating existing translation strings for the documentation

The documentation in French is located in the `docs` folder while the English documentation is located in the `docs/en` folder.
If you notice any spelling mistakes or wrong phrasing, you can correct them here.

## Translating to a new language

Please contact us by opening an issue so we can discuss this together!

## License

Magrit and its documentation are licensed under the GNU General Public License v3.0.

If you're contributing to Magrit, you're contributing GPL-3.0 code. Please make sure you're okay with that before contributing.