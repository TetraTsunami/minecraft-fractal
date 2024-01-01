let blockData = {};
const offscreen = new OffscreenCanvas(16, 16),
    ctx = offscreen.getContext("2d");

const blockTextures = "/block/";

let lastBlock = null;
let RGBatBlockPixelCache = {};
let blockByRGBCache = {};

const RGBatBlockPixel = async (blockName, [x, y]) => {
    if (RGBatBlockPixelCache[blockName + x + "-" + y]) {
        return RGBatBlockPixelCache[blockName + x + "-" + y];
    }
    if (blockName == lastBlock) {
        return ctx.getImageData(x, y, 1, 1).data;
    }
    // let res;
    // try {
    //     res = await fetch(blockTextures + blockName + ".png");
    // } catch (e) {
    //     console.log(e);
    //     return [0, 0, 0];
    // }
    // const blob = await res.blob();
    // const imageBitmap = await createImageBitmap(blob);
    const blob = blockData[blockName].texture;
    const imageBitmap = await createImageBitmap(blob);
    ctx.drawImage(imageBitmap, 0, 0);
    const [r, g, b, _] = ctx.getImageData(x, y, 1, 1).data;
    lastBlock = blockName;
    RGBatBlockPixelCache[blockName + x + "-" + y] = [r, g, b];
    return [r, g, b];
};

const mod = (a, b) => ((a % b) + b) % b;

const zip = (...rows) =>
    [...rows[0]].map((_, c) => rows.map((row) => row[c]));

const distanceFromColor = (color1, color2) =>
    zip(color1, color2).reduce(
        (acc, [dest, cur]) => acc + Math.pow(dest - cur, 2),
        0
);
    
const blockByRGB = (query) => {
    if (blockByRGBCache[query]) return blockByRGBCache[query];
    const distances = [];
    for (block in blockData) {
        distances.push({
            name: block,
            distance: distanceFromColor(blockData[block].color, query),
        });
    };
    distances.sort((a, b) => a.distance - b.distance);
    blockByRGBCache[query] = distances[0].name;
    return distances[0].name;
};

const recursiveBlock = async (x, y, z) => {
    if (z <= 0) return "obsidian";
    return blockByRGB(
        await RGBatBlockPixel( await recursiveBlock(x / 16, y / 16, z - 1), [
            mod(x, 16),
            mod(y, 16),
        ])
    );
};

self.addEventListener("message", async function (e) {
    var message = e.data;
    switch (message.type) {
        case "blockData": {
            blockData = message.data;
            break;
        }
        case "tile": {
            const { x, y, z } = message.data.coords;
            self.postMessage({ data: await recursiveBlock(x, y, z), tileId: message.data.tileId });
            // self.postMessage(Promise.resolve(recursiveBlock(x, y, z)));
            break;
        }
    }
});
