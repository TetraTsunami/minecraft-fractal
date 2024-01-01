const MinecraftProjection = L.extend(L.Projection.LonLat, {
    bounds: new L.bounds([0, 0], [128, 128]),
});

const MinecraftCoords = L.extend(L.CRS.Simple, {
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
    // scrollWheelZoom: false, // disable original zoom function
    // smoothWheelZoom: true, // enable smooth zoom
    // smoothSensitivity: 1, // zoom speed. default is 1
    crs: CRS,
    minZoom: 0,
}).setView([0, 0], 0);
map.scrollWheelZoom = true;

const hash = new L.Hash(map);

const blockData = "./blockData.json",
    blockTextures = "./block/";

var tileWorkers = [];
var tileWorkerIndex = 0;

// Create the tile worker pool
function createTileWorkerPool(workerCount, workerScript, blockData) {
    for (var i = 0; i < workerCount; i++) {
        var worker = new Worker(workerScript);
        worker.postMessage({ type: "blockData", data: blockData });
        tileWorkers.push(worker);
    }
}

// Get the next available tile worker from the pool
function getNextTileWorker() {
    var worker = tileWorkers[tileWorkerIndex];
    tileWorkerIndex = (tileWorkerIndex + 1) % tileWorkers.length;
    return worker;
}

document.body.classList.add("loading");

var tiles = {};
var id = 0;
// Load and parse blockData.json in the main thread
fetch("blockData.json")
    .then((response) => response.json())
    .then(async (data) => {
        for (const block in data) {
            const res = await fetch(blockTextures + block + ".png");
            data[block].texture = await res.blob();
        };
        createTileWorkerPool(3, "./js/worker.js", data);

        const MinecraftFractalLayer = L.TileLayer.extend({
            createTile: function (coords, done) {
                var tile = document.createElement("img");

                L.DomEvent.on(
                    tile,
                    "load",
                    L.Util.bind(this._tileOnLoad, this, done, tile)
                );
                L.DomEvent.on(
                    tile,
                    "error",
                    L.Util.bind(this._tileOnError, this, done, tile)
                );

                tile.alt = "";

                const tileWorker = getNextTileWorker();

                tile.id = id++;
                tiles[tile.id] = tile;

                tileWorker.postMessage({
                    type: "tile",
                    data: { coords: coords, tileId: tile.id },
                });
                console.log(coords)
                return tile;
            },
        });
        minecraftFractal = new MinecraftFractalLayer("", {
            tileSize: 64,
            maxNativeZoom: "13",
            maxZoom: "13",
        }).addTo(map);
        console.log("Done loading data into workers");
        minecraftFractal.on("load", () => {
            document.body.classList.remove("loading");
            minecraftFractal.off("load");
        });

        // Listen for messages from the tile workers
        tileWorkers.forEach((worker) => {
            worker.addEventListener("message", function (e) {
                const message = e.data;
                const tile = tiles[message.tileId];
                tile.src = blockTextures + message.data + ".png";
                delete tiles[message.tileId];
            });
        });
    })
    .catch((error) => {
        console.error("Failed to load blockData.json:", error);
    });
