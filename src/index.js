const _assign = require("lodash.assign"),
  _concat = require("lodash.concat"),
  _forEach = require("lodash.foreach"),
  _get = require("lodash.get"),
  _toArray = require("lodash.toarray");

/**
 * A framework to intercept HTTP calls made via the request-promise HTTP client.
 */
class RequestPromiseMiddlewareFramework {
  /**
   * Create a new instance of the request-promise middleware framework.
   * @param {*} rp - Either an object that contains the request-promise instance to apply middleware to, or the
   * request-promise instance itself.
   * @param {function} rp.rp - The request-promise instance to apply middleware to.
   * @param {function} rp.PromiseDependency - The Promise implementation to use within the middleware framework;
   * defaults to native Promises.
   * @param {...function} middleware - Middleware to add to the specified request-promise's pipeline.
   */
  constructor(rp) {
    if (typeof rp === "function") {
      this.rp = rp;
      this.Promise = Promise;
    } else {
      const { rp: rpImpl, PromiseDependency = Promise } = rp;
      this.rp = rpImpl;
      this.Promise = PromiseDependency;
    }

    // If the specified Promise library does not contain the promisify function, use the one in the util module.
    this.promisify = this.Promise.promisify || require("util").promisify;

    this.middleware = [];

    // Processing the arguments this way allows the user to put as many middleware arguments as they like.
    if (arguments.length > 1) {
      const args = _toArray(arguments);
      args.shift();
      _forEach(args, mw => this.use(mw));
    }
  }

  /**
   * Specify additional middleware to use after the framework has been instantiated.
   * @param {array} middleware An array of functions implementing the middleware specification.
   */
  use(middleware) {
    this.middleware = _concat(this.middleware, middleware);
  }

  /**
   * Attach the current middleware list to the request promise get the modified request-promise instance.
   * @return {function} The request-promise with the previously specified middleware applied to its pipeline.
   */
  getMiddlewareEnabledRequestPromise() {
    const intercept = options => {
      // We have to treat this parameter differently because middleware will always want the full body, and changing
      // this from request to request will make middleware development more difficult and error prone.  We'll store it
      // away, so we can apply it later, but not affect the internal invocation of the middleware.
      const resolveWithFullResponse = _get(options, "resolveWithFullResponse", true);

      // Add a middleware that will actually perform the request. Additionally, using _concat makes a new array, so that
      // when we "shift" later, our member middleware will not be affected.
      const middleware = _concat(this.middleware, this._getInitialMiddleware.bind(this));

      // next is the recursive function that chains the middleware together.
      const next = (_options, _callback) => {
        // Grab the next middleware...
        const nextMiddleware = middleware.shift();
        // ...then invoke that middleware, which has the responsibility to call next (or cut the chain off by not
        // calling next)
        nextMiddleware(_options, _callback, next);
      };

      // Relating to the comment in _getInitialMiddleware: this returns a promise rather than a request (like
      // request-promise does). That's why we need to wrap request-promise in a promise in that function.
      return this.promisify(next)(options).then(response => {
        // Now reproduce the effect of "resolveWithFullResponse" to honor the caller's requirements
        if (resolveWithFullResponse) {
          return response;
        }
        return response.body;
      });
    };

    // This is the secret sauce: it allows us to chain request-promise behavior just before request promise is actually
    // called.  It also returns a new instance of request-promise, so we can keep building on established "pipelines".
    return this.rp.defaults(intercept);
  }

  _getInitialMiddleware(options, callback) {
    // This needs to be wrapped in a promise, because this can be passed into another instance of the framework. When
    // that happens, this will be a "request" the first time through, but will be a promise when it gets wrapped. This
    // inconsistency makes it looks like the promise is "dangling", but wrapping it in a promise makes the interface
    // consistent.
    return this.Promise.resolve(this.rp(_assign(options, { resolveWithFullResponse: true })))
      .then(response => callback(undefined, response, response.body))
      .catch(err => callback(err, _get(err, "response"), _get(err, "response.body")));
  }
}

module.exports = RequestPromiseMiddlewareFramework;
