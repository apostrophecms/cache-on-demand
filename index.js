var _ = require('lodash');
module.exports = cacheOnDemand;

function cacheOnDemand(fn, hasher) {
  if (!hasher) {
    hasher = cacheOnDemand.webHasher;
  }
  if (typeof(hasher) !== 'function') {
    // Implement 'always'
    var key = hasher;
    hasher = function() {
      return key;
    };
  }
  var pending = {};
  return function() {
    // Get something we can slice
    var argumentsArray = Array.prototype.slice.call(arguments);
    var args = argumentsArray.slice(0, argumentsArray.length - 1);
    var callback = argumentsArray[argumentsArray.length - 1];
    var key = hasher.apply(this, args);
    if (key === false) {
      // hasher says this request can't be cached
      return fn.apply(this, arguments);
    }
    if (pending[key]) {
      // A request is in progress, queue up to be sent
      // the same result on completion
      pending[key].push(callback);
      return;
    }
    // start a new pending queue
    pending[key] = [ callback ];
    args.push(function() {
      var i;
      var list = pending[key];
      // Delete the queue before invoking the callbacks,
      // so we don't risk establishing a chain with no
      // breaks to generate more up-to-date results. The
      // idea is to deliver on demand to everyone who
      // showed up during the generation of this result,
      // and then be open to generating a new result
      delete pending[key];

      // Capture arguments being passed to callback so we
      // can pass them to deliver()
      var argumentsArray = Array.prototype.slice.call(arguments);

      // Deliver results to everyone in the queue
      for (i = 0; (i < list.length); i++) {
        deliver(i);
      }

      function deliver(i) {
        // Make sure we're async as the
        // caller expects
        setImmediate(function() {
          list[i].apply(this, argumentsArray);
        });
      }
    });
    return fn.apply(this, args);
  };
}
