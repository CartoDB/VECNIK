- Performance tests on inline draw operations+switch/case vs. prepared functions, accessd by clas property key
- update shaders individually (workers)
- consider a reander pipeline, sorted by layer, shader properties
- are shaders shared? probably hash+index them
- do we need custom renderers?


- canvas tiles:
  simpler sync rendering
  no stitching issues
  'parallel' rendering

- full canvas
  single engine start
  uniform to webgl
  continuous objects -> highlighting


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
- (ENGINES)