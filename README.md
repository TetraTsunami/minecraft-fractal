A proof of concept project that allows one to "infinitely" zoom in to a Minecraft block grid, inspired by [this reddit post](https://www.reddit.com/r/Minecraft/comments/142i5h8/i_programmed_this_infinite_block_recursion_now/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button).
It doesn't actually go infinitely, because of limitations of Leaflet, but it does allow you to pan and zoom out, and uses Web Workers for multithreading. 
I think there's potential for true infinite zoom, better styling, and less memory usage if I moved to another method of display.

![fractalexample](https://github.com/TetraTsunami/minecraft-fractal/assets/78718829/eb76bac9-ed27-4feb-a016-66fd3f5d4e87)
## Setup
- You'll need to provide the textures yourself. They can any set of 16x16 square PNG images, and should be placed in a directory named ./block/.
- Run `npm i && node ./process.js` to obtain blockData.json (this is effectively a LUT of each block's 'average' color. I might be able to achieve better performance by precalculating more things here, but each worker already caches some data)
- Navigating to `index.html` should load everything. I recommend using VSCode's Live Preview extension.
  - Your VSCode instance might crash if you zoom too far in. Whoops
