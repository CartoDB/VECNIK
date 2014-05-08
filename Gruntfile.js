module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      options: {
//        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'js/<%= pkg.name %>.leaflet.js',
        dest: 'build/<%= pkg.name %>(uglify).js'
      }
    },

    "closure-compiler": {
      frontend: {
        closurePath: 'node_modules/closure-compiler/lib',
        js: 'js/<%= pkg.name %>.leaflet.js',
        jsOutputFile: 'build/<%= pkg.name %>(closure).js',
        maxBuffer: 500,
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
  grunt.registerTask('compress', ['uglify', 'closure-compiler']);

};
