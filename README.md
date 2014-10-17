# cache-on-demand

<a href="http://apostrophenow.org/"><img src="https://raw.githubusercontent.com/boutell/cache-on-demand/master/logos/logo-box-madefor.png" align="right" /></a>

"On demand" caching that kicks in only when requests arrive simultaneously.

```javascript
var cacheOnDemand = require('cache-on-demand');

// A simple CMS with Express, needs to fetch the
// descendants of the current page on every pageview

var app = require('express')();
var pages = mongo.collection('pages');

app.get('*', function(req, res) {
  var descendants;
  return cacheOnDemand(
    getDescendants, cacheOnDemand.express
  )(req, function(err, pages) {
    return res.render({ descendants: pages });
  });

  // Find pages nested under this one
  RegExp.quote = require('regexp-quote');
  function getDescendants(callback) {
    // Fetch every page that starts with req.url, then a /
    return pages.find({ slug: new RegExp('^' + RegExp.quote(req.url) + '/') }).toArray(err, pages) {
      return callback(err, pages);
    });
  }
}
});
```

Under light load, with requests arriving far apart, every request for a given `req.url` will get an individually generated response, which gives them the newest content. Just like calling `getDescendants` directly.

But under heavy load, with new requests arriving while the first request is still being processed, the additional requests are queued up. When the first response is ready, it is simply sent to all of them. And then the response is discarded, so that the next request to arrive will generate a new response with the latest content.

This gives us "on demand" caching. The server is still allowed to generate new responses often, just not many of them simultaneously. It is the shortest practical lifetime for cache requests and largely  eliminates concerns about users seeing old content, as well as concerns about cache memory management.

## Make your own rules: custom hashers

`cache-on-demand` isn't just for Express. Instead of `cacheOnDemand.express`, you can pass your own hash function as the second argument.

Your hash function will receive the same arguments as your main function, except for the callback. Examine those arguments and return a suitable cache key as a string. For instance, `cacheOnDemand.express` simply returns `req.url`.

If a request should *not* be cached and must be passed directly to your main function, return `false`. For instance, `cacheOnDemand` does this for requests that have a `user` property, requests that use the `POST` method, etc.

## cacheOnDemand.express: the details

By default, `cacheOnDemand.express` assumes the first argument to your main function is an Express `req` object, and will return `false` unless both of these statements are true:

* `req.method` is `GET` or `HEAD`. This protects against caching form submissions, for instance.
* `req.user` is falsy. This protects against caching personalized responses for logged-in users.

If the above conditions are met, `cacheOnDemand.express` returns `req.url`. That way, responses for `/welcome` and `/goodbye` are cached separately.

## What about errors?

If your main function reports an error, it is reported to the original caller and all of the pending callers as well. We deliver exactly what we get from your main function.

## About P'unk Avenue and Apostrophe

`cache-on-demand` was created at [P'unk Avenue](http://punkave.com) for use in many projects built with Apostrophe, an open-source content management system built on node.js. If you like `cache-on-demand` you should definitely [check out apostrophenow.org](http://apostrophenow.org).

## Support

Feel free to open issues on [github](http://github.com/punkave/cache-on-demand).

<a href="http://punkave.com/"><img src="https://raw.githubusercontent.com/boutell/cache-on-demand/master/logos/logo-box-builtby.png" /></a>

## Changelog

### CHANGES IN 0.1.0

Initial release. With shiny unit tests, of course.
