
Technical considerations
========================


### Rendering strategies

Use cases are contradictionary. I.e. static data requires intial render + updates after map movement.
Heavy CartoCSS play in Editor adds updates on style change but not in parallel with map movement.
It can probably be speed up by splitting into layers (behind/affected/above) but rules can be very complex and affect a dynamic range of items. Needs investigation.

In Torque everything changes at all times. Effectively causing a render loop as worst case.
We need to discuss, whether Torque should be fully covered by the same rendering mechanisms.



- We will render on demand only. That includes: tile loading, (map movement/zoom), style changes, a torque timeline tick. Esp. the last can easily result in continous rendering. *IMPORTANT*
- Need to triangulate lines in WebGL.
- Renderers with proper interface can be injected, VECNIK.renderer is default


### Tile based rendering

#### pro
- Data tiles map directly to render tiles -> easier to understand.
- No need to clip data, but maybe in order to save bandwidth.
- Assume we render on demand only: a change of a tile doesn't require a full refresh. *IMPORTANT*


### Viewport based rendering

#### pro
- Interaction and highlighting are simpler as features are not cut. *IMPORTANT*
- There could be only one queue of render vertex data like in WebGL. *IMPORTANT* Right now on render, data is collected from every tile. This can be merged into a list of features and eventually into spearate buffers. That also requires index buffers and property storage in order to access all data needed.
- When continuous rendering (i.e. Torque) many FPS are achieved easier. Just one loop and one render init per frame. *IMPORTANT*

#### con
- Need to sort out duplicate items on each render pass.


### CartoCSS
- Sort items by layer, then by style. *IMPORTANT*
- Keep style classes as reference to features. *IMPORTANT*
- No full state changes. *IMPORTANT*
- 2d: try to render a path over all objects with same style. *IMPORTANT*
- Investigate whether condition checks vs. compilation ist faster. We use functions anyway..
- Use workers for compilation if suitable.
- Unclear, how these match to WebGL.

### Data
- Consider indexing geometries as tile.
- Consider clipped data in database.
- Consider storing geometry, simplified per level.
--> When separating geometry from CSS, we ask for the same data over and over again. *IMPORTANT*
- Triangulation should be part of the frontend --> WebGL renderer.

### Map integration
- Rendering on map movement should be avoided. Translating the canvas during map move saves from missing borders but keeping it along the map saves from redraw. We can probably render at full tile overage (overscan) for good compromise. *IMPORTANT*
- Rethink level of integration: 'deeply' provides a nice play with all map features, but also relies a lot on it and is massive API investigation.
  Generalized approach allows more and simpler map adapters, is less common to specific map programmers but more common for a single product.
- Consider Tile objects and managers less tied to map engines.


### Other
- For hit detection we should investigate hit maps, r-trees, bbox+polygon intersections, intersection with x/y index. Likely bbox+poly intersection is good enough. (tile based rendering would reduce complexity here)
- GeoJSON or VectorTile providers with proper interface can be injected, CartoDB is default. We will have parsers for both.


### VECNIK TODO
- Event handling could be optimized
- XHR can be reworked, also in order to handle CORS better on IE.
- Use array buffers where applicable.
- Avoid complex point/coordinate objects. p[x,y] is fine.
- Rethink data models. They are straightforward to use baut also overhead.
