/*
Code attributed to Lesson 9: Full Responsiveness, Concepts 10: Quiz, Project 3
http://udacity.github.io/responsive-images/downloads/RI-Project-Part-3-Start.zip

 After you have changed the settings under responsive_images
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      dist: {
        options: {
          banner: '/* Concatenating all js files */\n'
        },
        files: {
          'dist/sw.js': ["js/sw.js"],
          'dist/idb.js': ["js/idb.js"],
          'dist/script-main.js': ["js/*.js", "!js/restaurant_info.js", "!js/idb.js", "!js/sw.js"],
          'dist/script-details.js': ["js/*.js", "!js/main.js", "!js/idb.js", "!js/sw.js"],
        },
      //   src : ["js/idb.js", "js/*.js"],
      //   dest : "dist/script.js"
      },
      // sw : {
      //   src : ["js/sw/sw.js"],
      //   dest : "dist/sw/sw.js"
      // }
    },

    uglify: {
      dist: {
        options: {
          banner: '/* Uglifying all js files */\n'
        },
        files: {
          'dist/sw.min.js': ["dist/sw.js"],
          'dist/idb.min.js': ["dist/idb.js"],
          'dist/script-main.min.js': ['dist/script-main.js'],
          'dist/script-details.min.js': ['dist/script-details.js'],
        },
      }
    },

    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [{
            width: 800,
            suffix: '_large_2x'
          },{
            width: 800,
            suffix: '_large_1x',
            quality: 50
          },{
            width: 600,
            suffix: '_medium_2x'
          },{
            width: 600,
            suffix: '_medium_1x',
            quality: 40
          }]
        },

        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img_src/',
          dest: 'img/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['img']
        },
      },
    },

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');

  grunt.registerTask('default', ['concat', 'clean', 'mkdir', 'responsive_images']);

};
