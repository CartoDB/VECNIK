
//========================================
// shader
//========================================

(function(VECNIK) {

  var propertyMapping = {
    'point-color': 'fillStyle',
    'line-color': 'strokeStyle',
    'line-width': 'lineWidth',
    'line-opacity': 'globalAlpha',
    'polygon-fill': 'fillStyle',
    'polygon-opacity': 'globalAlpha'
  };

  var defaults = {
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1.0,
    lineCap: 'round'
  };

  VECNIK.CartoShader = function(shader) {
    VECNIK.Events.prototype.constructor.call(this);
    this._compiled = {};
    this.compile(shader);
  };

  var proto = VECNIK.CartoShader.prototype = new VECNIK.Events();

  proto.setContext = function(context) {
    this._context = context;
  },

  proto.compile = function(shader) {
    this._shaderSrc = shader;
    if (typeof shader === 'string') {
      shader = eval("(function() { return " + shader +"; })()");
    }
    var property;
    for (var attr in shader) {
      if (property = propertyMapping[attr]) {
        this._compiled[property] = eval("(function() { return shader[attr]; })();");
      }
    }

    this.emit('change');
  };

  proto.apply = function(featureProperties, zoom) {
    var
      shader = this._compiled,
      val;
    for (var prop in shader) {
      val = shader[prop];
      if (typeof val === 'function') {
        // TODO: inject map zoom
        val = val(featureProperties, { zoom: zoom });
      }
      if (val === null) {
        val = defaults[prop];
      }
      // TODO: careful, setter context.fillStyle = '#f00' but getter context.fillStyle === '#ff0000' also upper case, lower case...
      // mybe store current values or ideally pre-expand them
      if (this._context[prop] !== val) {
        this._context[prop] = val;
      }
    }
  };

})(VECNIK);

if (typeof module !== 'undefined' && module.exports) {
  module.exports.CartoShader = CartoShader;
}
