
function CartoShader(shader) {
    this.compiled = {};
    this.compile(shader)
}

CartoShader.prototype.compile = function(shader) {
    if(typeof shader === 'string') {
        shader = eval("(function() { return " + shader +"; })()");
    }
    var mapper = {
        'point-color': 'fillStyle',
        'line-color': 'strokeStyle',
        'line-width': 'lineWidth',
        'polygon-fill': 'fillStyle'
    };
    for(var attr in shader) {
        var c = mapper[attr];
        if(c) {
            this.compiled[c] = eval("(function() { return shader[attr]; })();");
        }
    }
}

CartoShader.prototype.apply = function(canvas_ctx, data, render_context) {
    var shader = this.compiled;
    for(var attr in shader) {
        var fn = shader[attr];
        if(typeof fn === 'function') {
            fn = fn(data, render_context);
        } 
        canvas_ctx[attr] = fn;
    }
};

