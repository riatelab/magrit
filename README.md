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

The application will be available at [http://localhost:3000](http://localhost:3000). 

### Running for development, with electron

```bash
npm run dev:electron
```

A window will open with the application running.

### Building for production

```bash
npm run build
```

The application will be built in the `dist` directory.

### Building for production, with electron

```bash
npm run build:electron
```

The application will be built in the `release` directory.

## License

GPL-3.0-or-later
