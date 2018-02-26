const assert = require("assert-plus"),
  assign = require("lodash.assign"),
  concat = require("lodash.concat"),
  forEach = require("lodash.foreach"),
  get = require("lodash.get"),
  P = require("bluebird"),
  toArray = require("lodash.toarray");

class RequestPromiseMiddlewareFramework {
  constructor(rp) {
    assert.func(rp, "rp");
    this.rp = rp;
    this.middleware = [];

    // processing the arguments this way allows the user to put as many
    // middleware arguments as they like
    if (arguments.length > 1) {
      const args = toArray(arguments);
      args.shift();
      forEach(args, mw => this.use(mw));
    }
  }

  /**
   * Allows a user to add more middleware after the framework has been instantiated
   * @param {array} middleware an array of functions implementing the middleware specification
   */
  use(middleware) {
    this.middleware = concat(this.middleware, middleware);
  }

  /**
   * The middleware that passes the request through to the next request-promise instance
   * @param {object} options - the request-promise options
   * @param {function} callback - the function to call after the middleware has executed
   */
  initialMiddleware(options, callback) {
    // we need to wrap this in a promise, because this can be passed into
    // another instance of RPMF. When that happens, this will be a "request"
    // the first time through, but will be a promise when it gets wrapped.
    // this inconsistency makes it looks like the promise is "dangling",
    // but wrapping it in a promise makes the interface consistent.
    return P.resolve(this.rp(assign(options, { resolveWithFullResponse: true })))
      .then(response => callback(null, response, response.body))
      .catch(err => callback(err, null, null));
  }

  /**
   * Attaches the current middleware list to the request promise, and returns
   * the modified request-promise instance
  */
  getMiddlewareEnabledRequestPromise() {
    const intercept = options => {
      // we have to treat this parameter differently because middleware will always
      // want the full body, and changing this from request to request will make
      // middleware development more difficult and error prone.  We'll store it
      // away, so we can apply it later, but not affect the internal invocation of
      // the middleware.
      const resolveWithFullResponse = get(options, "resolveWithFullResponse", true);

      // add a middleware that will actually perform the request.  Additionally,
      // using concat makes a new array, so that when we "shift" later, our
      // member middleware will not be affected
      const middleware = concat(this.middleware, this.initialMiddleware.bind(this));

      // next is the recursive function that chains the middleware together
      const next = (_options, _callback) => {
        // grab the next middleware
        const nextMiddleware = middleware.shift();
        // then invoke that middleware, which has the responsibility
        // to call next (or cut the chain off by not calling next)
        nextMiddleware(_options, _callback, next);
      };

      // relating to the comment in initialMiddleware - this returns a promise
      // rather than a request (like request-promise does).  That's why we need
      // to wrap request-promise in a promise in that function.
      return P.promisify(next)(options)
        .then(response => {
          // now reproduce the effect of "resolveWithFullResponse" to honor
          // the caller's requirements
          if (resolveWithFullResponse) {
            return response;
          }
          return response.body;
        });
    };

    // this is the secret sauce - it allows us to chain request-promise behavior
    // just before request promise is actually called.  It also returns a new
    // instance of request-promise, so we can keep building on established "pipelines"
    return this.rp.defaults(intercept);
  }
}

module.exports = RequestPromiseMiddlewareFramework;
