const _assign = require("lodash.assign"),
    _toArray = require("lodash.toarray"),
    _forEach = require("lodash.foreach"),
    _concat = require("lodash.concat"),
    _get = require("lodash.get"),
    assert  = require("assert-plus"),
    Promise = require("bluebird");

const RequestPromiseMiddlewareFramework = function(rp) {
  if (!(this instanceof RequestPromiseMiddlewareFramework)) {
    return new RequestPromiseMiddlewareFramework(rp);
  }

  assert.func(rp, "rp");
  this.rp = rp;

  this.initialMiddleware = function(options, callback) {
    rp(_assign(options, { resolveWithFullResponse: true }))
      .then(response => callback(null, response, response.body))
      .catch(err => callback(err, null, null));
  };

  this.middleware = [ ];

  if (arguments.length > 1) {
    var args = _toArray(arguments);
    args.shift();
    _forEach(args, mw => this.use(mw));
  }
};

RequestPromiseMiddlewareFramework.prototype.use = function(middleware) {
  this.middleware = _concat(this.middleware, middleware);
};

RequestPromiseMiddlewareFramework.prototype.getMiddlewareEnabledRequestPromise = function() {
  var me = this;
  var intercept = function(options) {
    var resolveWithFullResponse = _get(options, "resolveWithFullResponse");
    var middleware = _concat(me.middleware, me.initialMiddleware);
    var next = function(__options, __callback) {
      var nextMiddleware = middleware.shift();
      nextMiddleware(__options, __callback, next);
    };
    var promisifiedNext = Promise.promisify(next);
    return promisifiedNext(options)
      .then(response => {
        if (resolveWithFullResponse) {
          return response;
        }
        return response.body;
      });
  };
  return me.rp.defaults(intercept);
};

module.exports = RequestPromiseMiddlewareFramework;
