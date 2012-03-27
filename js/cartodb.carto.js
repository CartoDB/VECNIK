// monkey patch
tree.Value.prototype.toJS = function() {
    var v = this.value[0].value[0];
    val = v.toString();
    if(v.is === "color") {
      val = "'" + val + "'";
    }
    return "_value = " + val + ";"
}
tree.Selector.prototype.toJS = function() {
  var opMap = {
    '=': '==='
  };
  return _.map(this.filters, function(filter) {
    var op = filter.op;
    if(op in opMap) {
      op = opMap[op];
    }
    var val = filter.val;
    if(filter._val !== undefined) {
      val = filter._val.toString(true);
    }
    return "data." + filter.key  + " " + op + " " + val;
  }).join(" && ");
}
tree.Ruleset.prototype.toJS = function() {
  var shaderAttrs = {};
  var _if = this.selectors[0].toJS();
  _.each(this.rules, function(rule) {
      if(rule instanceof tree.Rule) {
        shaderAttrs[rule.name] = shaderAttrs[rule.name] || [];
        if (_if) {
        shaderAttrs[rule.name].push(
          "if(" + _if + "){" + rule.value.toJS() + "}"
        );
        } else {
          shaderAttrs[rule.name].push(rule.value.toJS());
        }
      } else {
        if (rule instanceof tree.Ruleset) {
          var sh = rule.toJS();
          for(var v in sh) {
            shaderAttrs[v] = shaderAttrs[v] || [];
            for(var attr in sh[v]) {
              shaderAttrs[v].push(sh[v][attr]);
            }
          }
        }
      }
  });
  return shaderAttrs;
}


var CartoDB = CartoDB || {}
CartoDB.Carto = CartoDB.Carto || {}

function createFn(ops) {
  var body = ops.join('\n');
  return Function("data","var _value; " +  body + "; return _value; ");
}

function toCartoShader(ruleset) {
  var shaderAttrs = {};
  shaderAttrs = ruleset.rules[0].toJS();
  for(var attr in shaderAttrs) {
    shaderAttrs[attr] = createFn(shaderAttrs[attr]);
  }
  return shaderAttrs;
}


CartoDB.Carto.compile = function(style, callback) {
  var parse_env = {
      error: function(obj) {
        console.log("ERROR");
      }
  };

  var parser = new carto.Parser(parse_env)
  parser.parse(style, function(err, ruleset) {
    if(!err) {
      var shader = toCartoShader(ruleset);
      callback(shader);
    } else {
      callback(null);
    }
  });
}
CartoDB.Carto.init = function(callback) {
  carto_initialize(carto, './reference.json', function(carto) {
    CartoDB.Carto._carto = carto;
    console.log("CARTO - initilized");
    if(callback) callback(carto);
  });
}
