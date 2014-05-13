var srcFiles = [
  'js/core/core.js',
  'js/core/event.js',
  'js/core/request.js',
  'js/map/leaflet.js',
  'js/provider/cartodb.js',
  'js/provider/geojson.js',
  'js/renderer/canvas.js'
];

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: srcFiles,
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    'closure-compiler': {
      frontend: {
        closurePath: 'node_modules/closure-compiler/lib',
        js: srcFiles,
        jsOutputFile: 'dist/<%= pkg.name %>.cc.js',
        maxBuffer: 500,
        noreport: true,
        options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          language_in: 'ECMASCRIPT5_STRICT'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-closure-compiler');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);
  grunt.registerTask('compress', ['uglify', 'closure-compiler:frontend']);
};
