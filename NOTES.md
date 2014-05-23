
Technical considerations
========================

Points are mostly for 2d.

### Tile based rendering

#### pros

- Data tiles map directly to render tiles -> easier to understand.
- No need to clip data, but maybe in order to save bandwidth.
- Assume we render on demand only: a change of a tile doesn't require a full refresh. (Important)


### Viewport based rendering

#### pros

- Interaction and highlighting are simpler as features are not cut. (Important)
- There could be only one queue of render vertex data like in WebGL.
  Right now on render, data is collected from every tile. This can be merged into a list of features and eventually into spearate buffers.
  That also requires index buffers and property storage in order to access all data needed.
- When continuous rendering (i.e. Torque) many FPS are achieved easier. Just one loop and one render init per frame. (Important)

#### cons

- Need to sort out duplicate items on each render pass.


### CartoCSS




### Map interaction

- Rendering on map movement should be avoided.
  Translating the canvas during map move saves from missing borders.
  Keeping Canvas with the map saves from redraw. We can probably render at full tile overage for good compromise.




### Other


- For hit detection we should investigate hit maps, r-trees, bbox+polygon intersections, intersection with x/y index.
  Likely bbox+poly intersection is good enough. (tile based rendering would reduce complexity here)
- How do we create lines in WebGL? Likely polygons + triangulation. Algorithms needed.
- Renderers with proper interface can be injected, VECNIK.renderer is default
- GeoJSON or VectorTile providers with proper interface can be injected, CartoDB is default.
  We will have parsers for both. Triangulation should be part of the WebGL renderer.






styling

on demand
pan layer
iteraction => special map


WebGL: how to render/style a polygon?

- update shaders individually (workers)
- consider a reander pipeline, sorted by layer, shader properties
- are shaders shared? probably hash+index them
- do we need custom renderers?


TODO
*** events
*** xhr
*** L canvas layer adaption

there is not much need to change the vecnik/canvas layer play
esp. when flexibility >> performance

how deep should the integration be?

deep
- nice play
- prepared for future changes
- less code
- common usage for users

flexible
- less things to investigate
- slim adapters
- from product perpective: uniform interface

TOPICS:
- Canvas Rendering
- Tile Loading
- Data Formats
- CartoCSS
- (EVENTS)
- (ENGINES => tile handler, tile
