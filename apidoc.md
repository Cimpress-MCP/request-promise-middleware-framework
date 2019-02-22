<a name="RequestPromiseMiddlewareFramework"></a>

## RequestPromiseMiddlewareFramework
A framework to intercept HTTP calls made via the request-promise HTTP client.

**Kind**: global class  

* [RequestPromiseMiddlewareFramework](#RequestPromiseMiddlewareFramework)
    * [new RequestPromiseMiddlewareFramework(rp, ...middleware)](#new_RequestPromiseMiddlewareFramework_new)
    * [.use(middleware)](#RequestPromiseMiddlewareFramework+use)
    * [.getMiddlewareEnabledRequestPromise()](#RequestPromiseMiddlewareFramework+getMiddlewareEnabledRequestPromise) ⇒ <code>function</code>

<a name="new_RequestPromiseMiddlewareFramework_new"></a>

### new RequestPromiseMiddlewareFramework(rp, ...middleware)
Create a new instance of the request-promise middleware framework.


| Param | Type | Description |
| --- | --- | --- |
| rp | <code>\*</code> | Either an object that contains the request-promise instance to apply middleware to, or the request-promise instance itself. |
| rp.rp | <code>function</code> | The request-promise instance to apply middleware to. |
| rp.PromiseDependency | <code>function</code> | The Promise implementation to use within the middleware framework; defaults to native Promises. |
| ...middleware | <code>function</code> | Middleware to add to the specified request-promise's pipeline. |

<a name="RequestPromiseMiddlewareFramework+use"></a>

### requestPromiseMiddlewareFramework.use(middleware)
Specify additional middleware to use after the framework has been instantiated.

**Kind**: instance method of [<code>RequestPromiseMiddlewareFramework</code>](#RequestPromiseMiddlewareFramework)  

| Param | Type | Description |
| --- | --- | --- |
| middleware | <code>array</code> | An array of functions implementing the middleware specification. |

<a name="RequestPromiseMiddlewareFramework+getMiddlewareEnabledRequestPromise"></a>

### requestPromiseMiddlewareFramework.getMiddlewareEnabledRequestPromise() ⇒ <code>function</code>
Attach the current middleware list to the request promise get the modified request-promise instance.

**Kind**: instance method of [<code>RequestPromiseMiddlewareFramework</code>](#RequestPromiseMiddlewareFramework)  
**Returns**: <code>function</code> - The request-promise with the previously specified middleware applied to its pipeline.  
