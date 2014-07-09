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

    shell: {
      browserify: {
        command: 'node node_modules/browserify/bin/cmd.js src/main.js -s VECNIK -o ./<%= pkg.name %>.debug.js'
      },
      test: {
        command: 'phantomjs test/vendor/runner.js test/suite.html?noglobals=true'
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
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('browserify', 'Resolve modules', function() {
    grunt.task.run('shell:browserify');
  });

  grunt.registerTask('test', 'Run tests', function() {
    grunt.task.run('browserify');
    grunt.task.run('shell:test');
  });

  grunt.registerTask('lint', 'JSHint check', function() {
    grunt.task.run('browserify');
    grunt.task.run('jshint');
  });

  grunt.registerTask('release', 'Release build', function() {
    grunt.task.run('browserify');
    // grunt.task.run('lint');
    grunt.task.run('uglify');
    // grunt.task.run('test');
  });

  grunt.registerTask('default', 'Development build', function() {
    grunt.task.run('browserify');
  });

//  grunt.registerTask('compress', ['uglify', 'closure-compiler:frontend']);
};
