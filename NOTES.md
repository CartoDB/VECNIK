
Technical considerations
========================

### Tile based rendering

#### pro
- Data tiles map directly to render tiles -> easier to understand.
- No need to clip data, but maybe in order to save bandwidth.
- Assume we render on demand only: a change of a tile doesn't require a full refresh. IMPORTANT!


### Rendering strategies

- We will render on demand only. That includes: tile loading, (map movement/zoom), style changes, a torque timeline tick. Esp. the last can easily result in continous rendering. IMPORTANT!
- Need to triangulate lines in WebGL.
- Renderers with proper interface can be injected, VECNIK.renderer is default


### Viewport based rendering

#### pro
- Interaction and highlighting are simpler as features are not cut. IMPORTANT!
- There could be only one queue of render vertex data like in WebGL. IMPORTANT! Right now on render, data is collected from every tile. This can be merged into a list of features and eventually into spearate buffers. That also requires index buffers and property storage in order to access all data needed.
- When continuous rendering (i.e. Torque) many FPS are achieved easier. Just one loop and one render init per frame. IMPORTANT!

#### con
- Need to sort out duplicate items on each render pass.


### CartoCSS
- Sort items by layer, then by style. IMPORTANT!
- Keep style classes as reference to features. IMPORTANT!
- No full state changes. IMPORTANT!
- 2d: try to render a path over all objects with same style. IMPORTANT!
- Investigate whether condition checks vs. compilation ist faster. We use functions anyway..
- Use workers for compilation if suitable.
- Unclear, how these match to WebGL.


### Map integration
- Rendering on map movement should be avoided. Translating the canvas during map move saves from missing borders but keeping it along the map saves from redraw. We can probably render at full tile overage (overscan) for good compromise.
- Rethink level of integration: deeply provides a nice play with all map features, but also relies a lot on it and is massive api investigation.
  Generalized approach allows more and simpler map adapters, is less common to specific map programmers but more common for a single product.

### Other
- For hit detection we should investigate hit maps, r-trees, bbox+polygon intersections, intersection with x/y index. Likely bbox+poly intersection is good enough. (tile based rendering would reduce complexity here)
- GeoJSON or VectorTile providers with proper interface can be injected, CartoDB is default. We will have parsers for both. Triangulation should be part of the WebGL renderer.


### VECNIK TODO
- Event handling could be optimized
- XHR can be reworked, also in order to handle CORS better on IE.
- Consider Tile objects and managers less connected to map engines.
- Use array buffers where applicalble.
- Avoid coplex point/coordinate objects. p[x,y] is fine.
- Rethink data models. They are straightformward to use baut also overhead.
