module.exports = function(grunt) {
  // PATH where to store unzipped build
  var BUILD = process.env.KITT_EXT_BUILD_PATH || 'build';
  // PATH where to store final zip
  var DIST = process.env.KITT_EXT_DIST_PATH || 'dist';
  // Common JS globals
  var globals = {
    'document': false, 'console': false, 'alert': false, 'chrome': false,
    'module': false, 'process': false, 'window': false
  };

  // --------------------
  // Load task
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-contrib-compress');

  // Set working path
  var path = grunt.option('path') || '.';
  grunt.file.setBase(path);

  // --------------------
  // Read extension manifest
  var manifest = grunt.file.readJSON('manifest.json');
  // Update version string
  var version = manifest.version.split('.');
  for (var i = version.length; i < 3; i++) {
    version.push(0);
  }
  version[2]++;
  manifest.version = version.join('.');

  var backgroundScripts = [];
  if (manifest.background && manifest.background.scripts) {
    backgroundScripts = manifest.background.scripts;
  }

  var contentScripts = [];
  if (manifest.content_scripts) {
    manifest.content_scripts.forEach(function(c) {
      contentScripts = contentScripts.concat(c.js || []);
    });
  }

  // Replace build path with extension name
  BUILD = BUILD.replace(/\{NAME\}/, manifest.name);

  // --------------------
  // Read default config
  var config = grunt.file.readJSON('configure.json');
  var html = (config.html_path || 'html') + '/**/*.html';
  var css = (config.css_path || 'css') + '/**/*.css';
  var js = (config.js_path || 'js') + '/**/*.js';
  if (config.globals) {
    for (var n in config.globals) {
      globals[n] = config.globals[n];
    }
  }

  // --------------------
  // Grunt config
  grunt.initConfig({
    jshint: {
      options: {
        undef: true,
        unused: false,
        globals: globals
      },
      files: [js]
    },
    bumpup: {
      setters: {
        name: function(old, releaseType, options) {
          return manifest.name;
        },
        version: function(old, releaseType, options) {
          return manifest.version;
        },
        description: function(old, releaseType, options) {
          return manifest.description;
        }
      },
      files: [
        'manifest.json', 'bower.json'
      ]
    },
    exec: {
      bower: {
        command: 'bower install'
      }
    },
    copy: {
      main: {
        files: [
          {expand: true, src: [html, css, 'images/**/*', 'manifest.json'], dest: BUILD},
          {expand: true, src: backgroundScripts, dest: BUILD},
          {expand: true, src: contentScripts, dest: BUILD}
        ]
      }
    },
    useminPrepare: {
      html: html,
      options: {
        flow: {
          steps: {js: ['concat'], css: ['concat']},
          post: []
        },
        dest: BUILD + '/' + html
      }
    },
    usemin: {
      html: BUILD + '/' + html
    },
    compress: {
      main: {
        options: {
          mode: 'zip',
          archive: DIST + '/' + manifest.name + '.zip'
        },
        files: [
          {src: ['**'], dest: '.', expand: true, cwd: BUILD}
        ]
      }
    }
  });

  // --------------------
  // handle kitt extension without html pages
  if (grunt.file.expand(html).length === 0) {
    grunt.registerTask('_usemin', []);
  } else {
    grunt.registerTask('_usemin', ['useminPrepare', 'concat', 'usemin']);
  }

  grunt.registerTask('default', ['jshint', 'bumpup', 'exec:bower', 'copy', '_usemin', 'compress']);
};
