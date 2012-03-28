if(typeof importScripts !== "undefined") {
  importScripts('../js/mercator.js');
  importScripts('../js/geometry.js');

  self.onmessage = function(event) {
        var data = event.data;
        for(var i = 0; i < primitives.length; ++i) {
            var p = primitives[i];
            var converted = VECNIK.project_geometry(
              p.geometry, data.zoom, data.x, data.y
            );
            if(converted && converted.length !== 0) {
               p.geometry.projected = converted;
            } else {
               delete p.geometry.coordinates;
               //console.log("problem converting geometries");
            }
        }
        self.postMessage({primitives: primitives});
  };
} else {
}
