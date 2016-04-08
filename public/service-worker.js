importScripts('sw-toolbox.js');
var CACHE_PREFIX = 'brocsw-v';
var CACHE_VERSION = CACHE_PREFIX+'1460114589304';
toolbox.options.cache.name = CACHE_VERSION;
toolbox.options.debug = true;
var urlsToPrefetch = [
    '/',
    "assets/failed.png",
    "assets/megd.css",
    "assets/megd.css.map",
    "assets/megd.js",
    "assets/megd.map",
    "assets/passed.png",
    "assets/test-loader.js",
    "assets/test-support.css",
    "assets/test-support.js",
    "assets/test-support.map",
    "assets/tests.js",
    "assets/tests.map",
    "assets/vendor.css",
    "assets/vendor.js",
    "assets/vendor.map",
    "index.html",
    "index.html~",
    "testem.js",
    "tests/index.html"
];
urlsToPrefetch.forEach(function(url) {
  toolbox.router.any(url, toolbox.cacheFirst);
});
toolbox.precache(urlsToPrefetch);
self.addEventListener('install', function(event) {
console.log('Handling install event. Resources to pre-fetch:', urlsToPrefetch);
  if (self.skipWaiting) { self.skipWaiting(); }
});

self.addEventListener('activate', function(event) {
  // Delete all caches handled by broccoli-serviceworker.
  logDebug('Deleting out of date caches, current cache version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return (cacheName.indexOf('$$$inactive$$$') === -1 && cacheName.indexOf(CACHE_PREFIX) === 0 && cacheName !== CACHE_VERSION);
        }).map(function(cacheName) {
          logDebug('Deleting out of date cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      self.clients.claim();
    })
  );
});

function logDebug() {
  if (toolbox.options.debug) {
    if (arguments.length > 1) {
      var consoleArgs = [];
      for (var i=1;i<arguments.length;i++) {
        consoleArgs.push(arguments[i]);
      }
      console.log(arguments[0], consoleArgs);
    } else {
      console.log(arguments[0]);
    }
  }
}
