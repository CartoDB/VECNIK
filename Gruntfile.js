module.exports = function(grunt) {

  var files = require('./files');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: '\n'
      },
      dist: {
        src: files,
        dest:  'dist/<%= pkg.name %>.debug.js'
      }
    },

    dummyCombine: {
      script: 'node node_modules/browserify/bin/cmd.js src/main.js -s VECNIK -o ./vecnik.js'
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: files,
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    'closure-compiler': {
       frontend: {
         closurePath: 'node_modules/closure-compiler/lib',
         js: files,
         jsOutputFile: 'dist/<%= pkg.name %>.cc.js',
         maxBuffer: 500,
         noreport: true,
         options: {
           compilation_level: 'ADVANCED_OPTIMIZATIONS',
           language_in: 'ECMASCRIPT5_STRICT'
        }
      }
    },

    jasmine: {
      pivotal: {
        src: files,
        options: {
          specs: 'test/**/*.spec.js'//,
//          helpers: ['test/lib/sinon-1.3.4.js', 'test/spec/*Helper.js', 'https://maps.google.com/maps/api/js?sensor=false&v=3.12']
        }
      }
    },

    jshint: {
      all: ['src/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-closure-compiler');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['concat']);
  grunt.registerTask('compress', ['uglify', 'closure-compiler:frontend']);
};
