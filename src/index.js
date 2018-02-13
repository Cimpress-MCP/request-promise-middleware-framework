var assert  = require("assert-plus"),
    assign  = require("lodash.assign"),
    concat  = require("lodash.concat"),
    forEach = require("lodash.foreach"),
    get     = require("lodash.get"),
    Promise = require("bluebird"),
    toArray = require("lodash.toarray");

var RequestPromiseMiddlewareFramework = function(rp) {
  if (!(this instanceof RequestPromiseMiddlewareFramework)) {
    return new RequestPromiseMiddlewareFramework(rp);
  }

  assert.func(rp, "rp");
  this.rp = rp;

  this.initialMiddleware = function(options, callback) {
    rp(assign(options, { resolveWithFullResponse: true }))
      .then(response => callback(null, response, response.body))
      .catch(err => callback(err, null, null));
  };

  this.middleware = [ ];

  if (arguments.length > 1) {
    var args = toArray(arguments);
    args.shift();
    forEach(args, mw => this.use(mw));
  }
};

RequestPromiseMiddlewareFramework.prototype.use = function(middleware) {
  this.middleware = concat(this.middleware, middleware);
};

RequestPromiseMiddlewareFramework.prototype.getMiddlewareEnabledRequestPromise = function() {
  var me = this;
  var intercept = function(options) {
    var resolveWithFullResponse = get(options, "resolveWithFullResponse", true);
    var middleware = concat(me.middleware, me.initialMiddleware);
    var next = function(_options, _callback) {
      var nextMiddleware = middleware.shift();
      nextMiddleware(_options, _callback, next);
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
