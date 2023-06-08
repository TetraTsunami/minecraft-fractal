const mod = (a, b) => ((a % b) + b) % b;

const MinecraftProjection = L.extend(L.Projection.LonLat, {
    bounds: new L.bounds([0, 0], [1, 1]),
});

const MinecraftCoords = L.extend(L.CRS.Simple, {
    // 1 unit = 1 block
    scale: function (zoom) {
        return Math.pow(16, zoom);
    },
    zoom: function (scale) {
        return Math.log(scale) / Math.LN2;
    },
    projection: MinecraftProjection,
}),
    CRS = MinecraftCoords;

const map = L.map("fractal", {
    scrollWheelZoom: false, // disable original zoom function
    smoothWheelZoom: true, // enable smooth zoom
    smoothSensitivity: 1, // zoom speed. default is 1
    crs: CRS,
    minZoom: 1.5,
}).setView([0, 0], 2);
map.scrollWheelZoom = true;

const hash = new L.Hash(map);

const offscreen = new OffscreenCanvas(16, 16),
    offscreenCtx = offscreen.getContext("2d");

const blockData = "./blockData.json",
    blockTextures = "./block/";

let lastBlock = null;
const RGBatBlockPixel = (blockName, [x, y]) => {
    if (blockName == lastBlock) {
        return offscreenCtx.getImageData(x, y, 1, 1).data;
    }
    const img = new Image();
    img.src = blockTextures + blockName + ".png";
    offscreenCtx.drawImage(img, 0, 0);
    const [r, g, b, _] = offscreenCtx.getImageData(x, y, 1, 1).data;
    lastBlock = blockName;
    return [r, g, b];
};

let blockByRGBCache = {};

fetch(blockData)
    .then((res) => 
         res.json()
    )
    .then((data) => {
        const blockByRGB = (query) => {
            if (blockByRGBCache[query]) return blockByRGBCache[query];
            const zip = (...rows) =>
                [...rows[0]].map((_, c) => rows.map((row) => row[c]));
            const distanceFromColor = (color1, color2) =>
                zip(color1, color2).reduce(
                    (acc, [dest, cur]) => acc + Math.pow(dest - cur, 2),
                    0
                );
            const distances = data.map((block) => ({
                name: block.name,
                distance: distanceFromColor(block.color, query),
            }));
            distances.sort((a, b) => a.distance - b.distance);
            blockByRGBCache[query] = distances[0].name;
            return distances[0].name;
        };
        
        const FractalLayer = L.TileLayer.extend({
            getTileBlock: function ({ x, y, z }) {
                const recursiveBlock = (x, y, z) => {
                    if (z <= 2) return "obsidian";
                    return blockByRGB(
                        RGBatBlockPixel(recursiveBlock(x / 16, y / 16, z - 1), [
                            mod(x, 16),
                            mod(y, 16),
                        ])
                    );
                };
                return recursiveBlock(x, y, z);
            },
            getTileUrl: function ({ x, y, z }) {
                return blockTextures + this.getTileBlock({ x, y, z }) + ".png";
            },
        });

        L.tileLayer.fractal = () => new FractalLayer();
        const baselayer = L.tileLayer
            .fractal({ tileSize: 128, maxZoom: "40"})
            .addTo(map);
        
        });
    


// L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//     maxZoom: 19,
//     attribution:
//         '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
// }).addTo(map);

// L.tileLayer("http://localhost:3000/{z}/{x}/{y}.png", {tileSize: 128, className: "block", maxZoom: "40"}).addTo(map);