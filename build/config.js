
var srcPath = '../js/osmb';
var dstPath = '../dist';

exports.COPYRIGHT = '/**\n' +
                    ' * Copyright (C) CartoDB\n' +
                    ' */\n';

exports.VERSION = '0.1';

exports.srcFiles = [
  srcPath + '/prefix.js',
  srcPath + '/shortcuts.js',
  srcPath + '/variables.js',
  srcPath + '/functions.js',
  srcPath + '/GeoJSON.js',
  srcPath + '/Cache.js',
  srcPath + '/Data.js',
  srcPath + '/Debug.js',
  srcPath + '/Canvas.js',
  srcPath + '/adapter.js',
  srcPath + '/{engine}.js',
  srcPath + '/public.js',
  srcPath + '/suffix.js'
];

exports.dstFiles = {
  debug:    dstPath + '/Vecnik-{engine}.debug.js',
  minified: dstPath + '/Vecnik-{engine}.js',
  gzipped:  dstPath + '/Vecnik-{engine}.js.gz'
};

exports.engines = ['Leaflet'];

exports.jshint = {
	"browser": true,
	"node": true,
	"predef": ["XDomainRequest", "L"],
//"unused": true,

	"debug": false,
	"devel": false,

	"es5": false,
	"strict": false,
	"globalstrict": false,

	"asi": false,
	"laxbreak": false,
	"bitwise": false,
	"boss": false,
	"curly": false,
	"eqnull": false,
	"evil": false,
	"expr": false,
	"forin": true,
	"immed": true,
	"latedef": true,
	"loopfunc": false,
	"noarg": true,
	"regexp": true,
	"regexdash": false,
	"scripturl": false,
	"shadow": false,
	"supernew": false,
	"undef": true,
	"funcscope": false,

	"newcap": true,
	"noempty": true,
	"nonew": true,
	"nomen": false,
	"onevar": false,
	"plusplus": false,
	"sub": false,
//"indent": 4,

	"eqeqeq": true,
//"trailing": true,
//"white": false,
	"smarttabs": true
};

exports.closure = {
  compilation_level: 'SIMPLE_OPTIMIZATIONS'	// WHITESPACE_ONLY, ADVANCED_OPTIMIZATIONS, SIMPLE_OPTIMIZATIONS
};
