/*jshint node:true*/
/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
  environment = EmberApp.env(),
  isProduction = environment === 'production',
  //mythCompress = isProduction || environment === 'test',
  disabled = {enabled: false};
  //assetLocation;

  assetLocation = function (fileName) {
    if (isProduction) {
      fileName = fileName.replace('.', '.min.');
    }
    return '/assets/' + fileName;
  };

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
        babel: {
            optional: ['es6.spec.symbols'],
            includePolyfill: true
        },
        outputPaths: {
            app: {
                js: assetLocation('meg.js')
            },
            vendor: {
                js:  assetLocation('vendor.js'),
                css: assetLocation('vendor.css')
            }
        },
        /*mythOptions: {
            source: './app/styles/app.css',
            inputFile: 'app.css',
            browsers: 'last 2 versions',
            // @TODO: enable sourcemaps for development without including them in the release
            sourcemap: false,
            compress: mythCompress,
            outputFile: isProduction ? 'meg.min.css' : 'meg.css'
        },*/
        hinting: false,
        fingerprint: disabled,
        'ember-cli-selectize': {
            theme: false
        }
    });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.
  app.import( 'bower_components/validator-js/validator.js');
  app.import( 'bower_components/bootstrap/dist/css/bootstrap-theme.css.map' );
  app.import( 'bower_components/bootstrap/dist/css/bootstrap.css');
  app.import( 'bower_components/font-awesome/css/font-awesome.min.css');
  app.import( 'bower_components/highlightjs/highlight.pack.js');
  app.import( 'bower_components/highlightjs/styles/tomorrow.css');
  app.import('bower_components/devicejs/lib/device.js');

  return app.toTree();
};
