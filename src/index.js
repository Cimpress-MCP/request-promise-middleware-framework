var _       = require("lodash"),
    assert  = require("assert-plus"),
    Promise = require("bluebird");

var RequestPromiseInterceptor = function(rp, interceptors) {
  if (!(this instanceof RequestPromiseInterceptor)) {
    return new RequestPromiseInterceptor(rp, interceptors);
  }

  assert.func(rp, "rp");
  this.rp = rp;

  this.initialInterceptor = function(options, callback) {
    rp(_.assign(options, { resolveWithFullResponse: true }))
      .then(response => callback(null, response, response.body))
      .catch(err => callback(err, null, null));
  };

  this.interceptors = [ ];

  if (interceptors) {
    this.use(interceptors);
  }
};

RequestPromiseInterceptor.prototype.use = function(interceptors) {
  this.interceptors = _.concat(this.interceptors, interceptors);
};

RequestPromiseInterceptor.prototype.getInterceptedRequestPromise = function() {
  var me = this;
  var intercept = function(options) {
    var resolveWithFullResponse = _.at(options, "resolveWithFullResponse");
    var interceptors = _.concat(me.interceptors, me.initialInterceptor);
    var next = function(_options, _callback) {
      var nextInterceptor = interceptors.shift();
      nextInterceptor(_options, _callback, next);
    };
    var promisifiedNext = Promise.promisify(next);
    return promisifiedNext(options)
      .then(response => {
        if (resolveWithFullResponse === true) {
          return response;
        }
        return response.body;
      });
  };
  return me.rp.defaults(intercept);
};

module.exports = RequestPromiseInterceptor;
