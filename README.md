# Magrit - Thematic cartography

[en] [Magrit](https://magrit.cnrs.fr) is an online mapping application developed by [UAR RIATE](https://riate.cnrs.fr/).  
[fr]  [Magrit](https://magrit.cnrs.fr) est une application de cartographie thématique développée par l'[UAR RIATE](https://riate.cnrs.fr/).

## Basics

- Magrit is a web application for thematic mapping (*cartography*).
- Everything happens in the browser, so **your data never leaves your computer**.
- It's intentionally simple (the UI follows the basic steps of map creation).
- It's **designed for teaching and learning cartography**.
- It lets you import **your own geometry dataset** (**Shapefile**, **GeoJSON**, **GML**, **GeoPackage**, etc.) and optionally your **tabular file** (CSV, XLS, XLSX, etc.).
- We also provide many sample datasets to try out the various representations and become familiar with the application.
- It allows to **render and combine a wide variety of maps**: choropleth, proportional symbols, cartogram, discontinuity, etc.
- It supports all the most popular modern desktop browsers.
- Magrit is written in modern JS (ES6) and uses notably the d3.js library as well as various WebAssembly modules (GDAL, GEOS, etc.)


## Usage


Requirements:

- Node.js (>= v18) / NPM (>= 9).

### Installation

```bash
npm install
```

### Running for development

```bash
npm run dev
```

### Building for production

```bash
npm run build
```

## Bundle Magrit with [neutralino](https://neutralino.js.org/)

Requirements:

- Node.js (>= v18) / NPM (>= 9).
- `@neutralinojs/neu` is installed globally (i.e. `npm install -g @neutralinojs/neu`).
- Dev. environment for Magrit v2 (see above).
- Path to Magrit v2 is stored in environment variable `MAGRIT-CODE` (i.e. `export MAGRITCODE='/home/mthh/code/magrit-v2-solid'`).

- Compile Magrit code as usual:

```
npm run build
```

- Initialise a folder to prepare Magrit bundle:

```
cd /tmp
neu create magrit-desktop --template neutralinojs/neutralinojs-zero
cd magrit-desktop
```

- Replace default configuration file by Magrit's one:

```
cp $MAGRITCODE/neutralino-magrit.config.json neutralino.config.json
```

- Delete the default code and replace it by Magrit's one:

```
rm -rf www/*
cp -r $MAGRITCODE/dist/* www/
```

- Prepare the bundle:

```
neu build --release
```

- TODO: prepare the bundle for each OS/arch (instead of a bundle that contain all the binary files for all supported systems)

## License

GPL-3.0-or-later
