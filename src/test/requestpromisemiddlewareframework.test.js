const chai = require("chai"),
  expect = require("chai").expect,
  RequestPromiseMiddlewareFramework = require("../index.js"),
  spies = require("chai-spies"),
  uuid = require("uuid/v4");

chai.use(spies);

describe("request-promise-middleware-framework", () => {
  let context;

  const runTests = ({ description, newApi, PromiseDependency }) => {
    describe(description, () => {
      beforeEach(() => {
        context = {};

        context.responseBody = uuid();
        context.rpResult = Promise.resolve({ body: context.responseBody });
        context.mockedRequestPromise = chai.spy(() => context.rpResult);
        context.mockedRequestPromise.defaults = chai.spy(requester => {
          context.overriddenRequest = chai.spy(options => requester(options));
          return context.overriddenRequest;
        });
        context.rpmfFirstParam = context.mockedRequestPromise;
        if (newApi) {
          context.rpmfFirstParam = { rp: context.mockedRequestPromise, PromiseDependency };
        }

        context.middleware = chai.spy((options, callback, next) => {
          context.middlewareCallback = chai.spy((err, response) => {
            callback(null, response, response.body);
          });
          next(options, context.middlewareCallback);
        });

        context.options = {
          uri: `http://${uuid()}`
        };
      });

      describe("And specifying one middleware layer", () => {
        beforeEach(() => {
          const rpmf = new RequestPromiseMiddlewareFramework(context.rpmfFirstParam, context.middleware);
          context.rp = rpmf.getMiddlewareEnabledRequestPromise();
        });

        describe("And getting the full response", () => {
          it("should execute the middleware appropriately before and after the request is made", () => {
            return context.rp(context.options).then(response => {
              expect(response).to.exist.and.be.an("object");
              expect(response)
                .to.have.property("body")
                .and.equal(context.responseBody);
              expect(context.mockedRequestPromise.defaults).to.have.been.called();
              expect(context.overriddenRequest).to.have.been.called();
              expect(context.middleware).to.have.been.called();
              expect(context.mockedRequestPromise).to.have.been.called();
              expect(context.middlewareCallback).to.have.been.called.once.with.exactly(
                undefined,
                { body: context.responseBody },
                context.responseBody
              );
            });
          });
        });

        describe("And not getting the full response", () => {
          beforeEach(() => {
            context.options.resolveWithFullResponse = false;
          });

          it("should execute the middleware appropriately before and after the request is made", () => {
            return context.rp(context.options).then(body => {
              expect(body).to.exist.and.equal(context.responseBody);
              expect(context.mockedRequestPromise.defaults).to.have.been.called();
              expect(context.overriddenRequest).to.have.been.called();
              expect(context.middleware).to.have.been.called();
              expect(context.mockedRequestPromise).to.have.been.called();
              expect(context.middlewareCallback).to.have.been.called.once.with.exactly(
                undefined,
                { body: context.responseBody },
                context.responseBody
              );
            });
          });
        });

        describe("And the request fails", () => {
          beforeEach(() => {
            context.rpResult = Promise.reject({ response: { body: context.responseBody } });
          });

          it("should execute the middleware appropriately before and after the request is made", () => {
            return context.rp(context.options).then(response => {
              expect(response).to.exist.and.be.an("object");
              expect(response)
                .to.have.property("body")
                .and.equal(context.responseBody);
              expect(context.mockedRequestPromise.defaults).to.have.been.called();
              expect(context.overriddenRequest).to.have.been.called();
              expect(context.middleware).to.have.been.called();
              expect(context.mockedRequestPromise).to.been.called();
              expect(context.middlewareCallback).to.have.been.called.once.with.exactly(
                { response: { body: context.responseBody } },
                { body: context.responseBody },
                context.responseBody
              );
            });
          });
        });
      });

      describe("And specifying multiple middleware layers", () => {
        beforeEach(() => {
          context.middleware2 = chai.spy((options, callback, next) => {
            context.middlewareCallback2 = chai.spy((err, response) => {
              callback(err, response, response.body);
            });
            next(options, context.middlewareCallback2);
          });
        });

        describe("And the middleware layers are passed as separate arguments", () => {
          it("should execute the middleware appropriately before and after the request is made", () => {
            const rpmf = new RequestPromiseMiddlewareFramework(
              context.rpmfFirstParam,
              context.middleware,
              context.middleware2
            );
            context.rp = rpmf.getMiddlewareEnabledRequestPromise();
            return context.rp(context.options).then(response => {
              expect(response).to.exist.and.be.an("object");
              expect(response)
                .to.have.property("body")
                .and.equal(context.responseBody);
              expect(context.mockedRequestPromise.defaults).to.have.been.called();
              expect(context.overriddenRequest).to.have.been.called();
              expect(context.middleware).to.have.been.called();
              expect(context.middleware2).to.have.been.called();
              expect(context.mockedRequestPromise).to.have.been.called();
              expect(context.middlewareCallback2).to.have.been.called.once.with.exactly(
                undefined,
                { body: context.responseBody },
                context.responseBody
              );
              expect(context.middlewareCallback).to.have.been.called.once.with.exactly(
                undefined,
                { body: context.responseBody },
                context.responseBody
              );
            });
          });
        });

        describe("And the middleware layers are passed as an array", () => {
          it("should execute the middleware appropriately before and after the request is made", () => {
            const rpmf = new RequestPromiseMiddlewareFramework(context.rpmfFirstParam, [
              context.middleware,
              context.middleware2
            ]);
            context.rp = rpmf.getMiddlewareEnabledRequestPromise();
            return context.rp(context.options).then(response => {
              expect(response).to.exist.and.be.an("object");
              expect(response)
                .to.have.property("body")
                .and.equal(context.responseBody);
              expect(context.mockedRequestPromise.defaults).to.have.been.called();
              expect(context.overriddenRequest).to.have.been.called();
              expect(context.middleware).to.have.been.called();
              expect(context.middleware2).to.have.been.called();
              expect(context.mockedRequestPromise).to.have.been.called();
              expect(context.middlewareCallback2).to.have.been.called.once.with.exactly(
                undefined,
                { body: context.responseBody },
                context.responseBody
              );
              expect(context.middlewareCallback).to.have.been.called.once.with.exactly(
                undefined,
                { body: context.responseBody },
                context.responseBody
              );
            });
          });
        });
      });

      describe("And short-circuiting a request with middleware", () => {
        it("should execute the middleware appropriately but not make the actual request", () => {
          const responseBody = uuid();
          context.middleware = chai.spy((options, callback) => {
            callback(null, { body: responseBody }, responseBody);
          });
          const rpmf = new RequestPromiseMiddlewareFramework(context.rpmfFirstParam, context.middleware);
          context.rp = rpmf.getMiddlewareEnabledRequestPromise();
          return context.rp(context.options).then(response => {
            expect(response).to.exist.and.be.an("object");
            expect(response)
              .to.have.property("body")
              .and.equal(responseBody);
            expect(context.mockedRequestPromise.defaults).to.have.been.called();
            expect(context.overriddenRequest).to.have.been.called();
            expect(context.middleware).to.have.been.called();
            expect(context.mockedRequestPromise).to.not.have.been.called();
            expect(context.middlewareCallback).to.not.exist;
          });
        });
      });

      describe("And executing a request with undefined middleware", () => {
        it("should execute not execute any middleware but the request should be executed successfully", () => {
          const rpmf = new RequestPromiseMiddlewareFramework(context.rpmfFirstParam);
          context.rp = rpmf.getMiddlewareEnabledRequestPromise();
          return context.rp(context.options).then(response => {
            expect(response).to.exist.and.be.an("object");
            expect(response)
              .to.have.property("body")
              .and.equal(context.responseBody);
            expect(context.mockedRequestPromise.defaults).to.have.been.called();
            expect(context.overriddenRequest).to.have.been.called();
            expect(context.middleware).to.not.have.been.called();
            expect(context.mockedRequestPromise).to.have.been.called();
            expect(context.middlewareCallback).to.not.exist;
          });
        });
      });

      describe("And executing a request with an empty array of middleware", () => {
        it("should execute not execute any middleware but the request should be executed successfully", () => {
          const rpmf = new RequestPromiseMiddlewareFramework(context.rpmfFirstParam, []);
          context.rp = rpmf.getMiddlewareEnabledRequestPromise();
          return context.rp(context.options).then(response => {
            expect(response).to.exist.and.be.an("object");
            expect(response)
              .to.have.property("body")
              .and.equal(context.responseBody);
            expect(context.mockedRequestPromise.defaults).to.have.been.called();
            expect(context.overriddenRequest).to.have.been.called();
            expect(context.middleware).to.not.have.been.called();
            expect(context.mockedRequestPromise).to.have.been.called();
            expect(context.middlewareCallback).to.not.exist;
          });
        });
      });
    });
  };

  runTests({ description: "When using native promises and the old API", newApi: false });
  runTests({ description: "When using native promises and the new API", newApi: true });
  runTests({ description: "When using bluebird promises", newApi: true, PromiseDependency: require("bluebird") });
});
