# request-promise-middleware-framework

A framework to intercept HTTP calls made via the request-promise HTTP client.

## Installation

    npm install request-promise-middleware-framework

## Middleware Definition

The framework simply expects any middleware to be a function of form:
```
function(options, callback, next) {
  // Add custom logic here.
  next(options, callback);
}
```

The `next()` call will call the next middleware in the chain. To add any logic on the response, you can modify the callback as follows:
```
function(options, callback, next) {
  const _callback = (err, response, body) => {
    // Add custom response logic here.
    callback(err, response, body);
  };
  next(options, _callback);
}
```

If instead you want to completely short-circuit the HTTP call, you can simply call the callback and provide your own error or response:
```
function(options, callback, next) {
  const body = "Everything's fine."
  callback(null, { statusCode: 200, body: body }, body);
}
```

## Using `resolveWithFullResponse`
While the middleware does attempt to leave request-promise as pristine as possible, the parameter `resolveWithFullResponse` makes that difficult.  Many of the components of a pipeline may need access to the full response, and any part of the pipeline that hides the possible data is frowned upon.  Therefore, the middleware framework must deal with that as a special case.  As in request-promise, this can be configured on the invocation of request-promise, however the pipeline itself will not respect any further configuration of the parameter.  The only difference you will experience between this and normal request-promise is that the default for this parameter is true.  At invocation of request-promise, you can still set this to false.

## Examples

Once you've defined your middleware, you can simply register it by creating a new framework object, and then getting the request object. If you want to use native Promises, you can do so as follows:
```
const rpMiddlewareFramework = new RequestPromiseMiddlewareFramework({ rp: require("request-promise") }, middleware);
const rp = rpMiddlewareFramework.getMiddlewareEnabledRequestPromise();
```

Or, if you want to use an alternate Promise library such as bluebird, you can do so as follows:

```
const bluebirdPromise = require("bluebird");
const rpMiddlewareFramework = new RequestPromiseMiddlewareFramework({ rp: require("request-promise"), PromiseDependency: bluebirdPromise }, middleware);
const rp = rpMiddlewareFramework.getMiddlewareEnabledRequestPromise();
```

In either case, you can then use returned ``rp`` object just like you normally would.

For a full example inside an express app, see the [sample](sample) directory within this repository.

## API Documentation

Go [here](apidoc.md) for the latest API documentation.

# License

[MIT](LICENSE)
