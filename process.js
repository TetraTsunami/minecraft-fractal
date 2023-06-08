import { getAverageColor } from "fast-average-color-node";
import fs from "fs";
import PImage from "pureimage";

let validBlockData = [];

fs.readdir("./block", (err, files) => {
    if (err) {
        console.log(err);
        return;
    }

    const promises = files.map((file) => {
        if (!file.endsWith(".png")) return Promise.resolve();

        return PImage.decodePNGFromStream(
            fs.createReadStream("./block/" + file)
        ).then((img) => {
            if (img.width !== img.height) return;

            for (let x = 0; x < img.width; x++) {
                for (let y = 0; y < img.height; y++) {
                    if ((img.getPixelRGBA(x, y) & 0xff) !== 255) return;
                }
            }

            return getAverageColor("./block/" + file).then((color) => {
                validBlockData.push({
                    name: file.replace(".png", ""),
                    color: color.value.slice(0, 3)
                });
            });
        });
    });

    Promise.all(promises)
        .then(() => {
            fs.writeFileSync(
                "./blockData.json",
                JSON.stringify(validBlockData)
            );
        })
        .catch((error) => {
            console.error(error);
        });
});