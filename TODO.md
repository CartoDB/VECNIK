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