module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

//    concat: {
//      options: {
//        separator: '\n'
//      },
//      dist: {
//        src: files,
//        dest:  'dist/<%= pkg.name %>.debug.js'
//      }
//    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd hh:ii:ss") %> */\n'
      },
      build: {
        src: '<%= pkg.name %>.debug.js',
        dest: '<%= pkg.name %>.js'
      }
    },

//    'closure-compiler': {
//       frontend: {
//         closurePath: 'node_modules/closure-compiler/lib',
//         js: files,
//         jsOutputFile: 'dist/<%= pkg.name %>.cc.js',
//         maxBuffer: 500,
//         noreport: true,
//         options: {
//           compilation_level: 'ADVANCED_OPTIMIZATIONS',
//           language_in: 'ECMASCRIPT5_STRICT'
//        }
//      }
//    },

//    jasmine: {
//      pivotal: {
//        src: files,
//        options: {
//          specs: 'test/**/*.spec.js'
//        }
//      }
//    },

    execute: {
      test: {
        src: ['phantomjs test/vendor/runner.js test/index.html?noglobals=true']
      }
    },


    // TODO: broken!
    // meanwhile exec this: node node_modules/browserify/bin/cmd.js src/main.js -s VECNIK -o ./vecnik.debug.js
    browserify: {
      js: {
        options: {
          browserifyOptions: { standalone: 'VECNIK' }
        },
        src: './src/main.js',
        dest: './<%= pkg.name %>.debug.js'
      }
    },

    jshint: {
      all: ['./<%= pkg.name %>.debug.js']
    }
  });

//  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
//  grunt.loadNpmTasks('grunt-closure-compiler');
//  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', 'Create development build', function() {
    grunt.task.run('browserify');
    grunt.task.run('uglify');
  });

  grunt.registerTask('lint', 'JSHint check', function() {
    grunt.task.run('browserify');
    grunt.task.run('jshint');
  });

//  grunt.registerTask('compress', ['uglify', 'closure-compiler:frontend']);
};
