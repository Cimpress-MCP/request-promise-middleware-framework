var _       = require("lodash"),
    assert  = require("assert-plus"),
    Promise = require("bluebird");

var RequestPromiseMiddlewareFramework = function(rp) {
  if (!(this instanceof RequestPromiseMiddlewareFramework)) {
    return new RequestPromiseMiddlewareFramework(rp);
  }

  assert.func(rp, "rp");
  this.rp = rp;

  this.initialMiddleware = function(options, callback) {
    rp(_.assign(options, { resolveWithFullResponse: true }))
      .then(response => callback(null, response, response.body))
      .catch(err => callback(err, null, null));
  };

  this.middleware = [ ];

  if (arguments.length > 1) {
    var args = _.toArray(arguments);
    args.shift();
    _.forEach(args, mw => this.use(mw));
  }
};

RequestPromiseMiddlewareFramework.prototype.use = function(middleware) {
  this.middleware = _.concat(this.middleware, middleware);
};

RequestPromiseMiddlewareFramework.prototype.getMiddlewareEnabledRequestPromise = function() {
  var me = this;
  var intercept = function(options) {
    var resolveWithFullResponse = _.get(options, "resolveWithFullResponse");
    var middleware = _.concat(me.middleware, me.initialMiddleware);
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
