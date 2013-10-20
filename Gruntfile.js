module.exports = function(grunt) {
  // Do grunt-related things in here
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: {
        src: ["dist/chart-min.js"]
      }
    },
    uglify: {
      js: {
        files: {
          'dist/chart-min.js': ['chart.js']
        }
      }
    },
    jshint: {
      all: ['chart.js']
    }
  });
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['clean', 'jshint', 'uglify' ]);
};

