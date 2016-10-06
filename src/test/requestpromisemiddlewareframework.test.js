var chai                              = require("chai"),
    expect                            = require("chai").expect,
    Promise                           = require("bluebird"),
    RequestPromiseMiddlewareFramework = require("../index.js"),
    spies                             = require("chai-spies"),
    uuid                              = require("node-uuid");

chai.use(spies);

describe("RequestPromiseMiddlewareFramework", function() {
  var context;

  beforeEach(function() {
    context = { };

    context.responseBody = uuid.v4();
    context.mockedRequestPromise = chai.spy(function(options, callback) {
      var response = { body: context.responseBody };
      return Promise.resolve(response);
    });
    context.mockedRequestPromise.defaults = chai.spy(function(requester) {
      context.overriddenRequest = chai.spy(function(options) {
        return requester(options);
      });
      return context.overriddenRequest;
    });

    context.middleware = chai.spy(function(options, callback, next) {
      context.middlewareCallback = chai.spy(function(err, response, body) {
        callback(err, response, response.body);
      });
      next(options, context.middlewareCallback);
    });

    var rpmf = new RequestPromiseMiddlewareFramework(context.mockedRequestPromise, context.middleware);
    context.rp = rpmf.getMiddlewareEnabledRequestPromise();

    context.options = {
      uri: `http://${uuid.v4()}`,
      resolveWithFullResponse: true
    };
  });

  describe("Executing a request and getting the full response with middleware", function() {
    it("should execute the middleware appropriately before and after the request is made", function() {
      return context.rp(context.options)
        .then(response => {
          expect(response).to.exist.and.be.an("object");
          expect(response).to.have.property("body").and.equal(context.responseBody);
          expect(context.mockedRequestPromise.defaults).to.have.been.called();
          expect(context.overriddenRequest).to.have.been.called();
          expect(context.middleware).to.have.been.called();
          expect(context.mockedRequestPromise).to.have.been.called();
          expect(context.middlewareCallback).to.have.been.called();
        });
    });
  });

  describe("Executing a request and getting the body only with middleware", function() {
    it("should execute the middleware appropriately before and after the request is made", function() {
      delete context.options.resolveWithFullResponse;
      return context.rp(context.options)
        .then(body => {
          expect(body).to.exist.and.equal(context.responseBody);
          expect(context.mockedRequestPromise.defaults).to.have.been.called();
          expect(context.overriddenRequest).to.have.been.called();
          expect(context.middleware).to.have.been.called();
          expect(context.mockedRequestPromise).to.have.been.called();
          expect(context.middlewareCallback).to.have.been.called();
        });
    });
  });

  describe("Executing a request with multiple middleware passed as arguments", function() {
    it("should execute the middleware appropriately before and after the request is made", function() {
      context.middleware2 = chai.spy(function(options, callback, next) {
        context.middlewareCallback2 = chai.spy(function(err, response, body) {
          callback(err, response, response.body);
        });
        next(options, context.middlewareCallback2);
      });
      var rpmf =
        new RequestPromiseMiddlewareFramework(context.mockedRequestPromise, context.middleware, context.middleware2);
      context.rp = rpmf.getMiddlewareEnabledRequestPromise();
      return context.rp(context.options)
        .then(response => {
          expect(response).to.exist.and.be.an("object");
          expect(response).to.have.property("body").and.equal(context.responseBody);
          expect(context.mockedRequestPromise.defaults).to.have.been.called();
          expect(context.overriddenRequest).to.have.been.called();
          expect(context.middleware).to.have.been.called();
          expect(context.middleware2).to.have.been.called();
          expect(context.mockedRequestPromise).to.have.been.called();
          expect(context.middlewareCallback2).to.have.been.called();
          expect(context.middlewareCallback).to.have.been.called();
        });
    });
  });

  describe("Executing a request with multiple middleware passed as an array", function() {
    it("should execute the middleware appropriately before and after the request is made", function() {
      context.middleware2 = chai.spy(function(options, callback, next) {
        context.middlewareCallback2 = chai.spy(function(err, response, body) {
          callback(err, response, response.body);
        });
        next(options, context.middlewareCallback2);
      });
      var middleware = [ context.middleware, context.middleware2 ];
      var rpmf = new RequestPromiseMiddlewareFramework(context.mockedRequestPromise, middleware);
      context.rp = rpmf.getMiddlewareEnabledRequestPromise();
      return context.rp(context.options)
        .then(response => {
          expect(response).to.exist.and.be.an("object");
          expect(response).to.have.property("body").and.equal(context.responseBody);
          expect(context.mockedRequestPromise.defaults).to.have.been.called();
          expect(context.overriddenRequest).to.have.been.called();
          expect(context.middleware).to.have.been.called();
          expect(context.middleware2).to.have.been.called();
          expect(context.mockedRequestPromise).to.have.been.called();
          expect(context.middlewareCallback2).to.have.been.called();
          expect(context.middlewareCallback).to.have.been.called();
        });
    });
  });

  describe("Short-circuiting a request with middleware", function() {
    it("should execute the middleware appropriately but not make the actual request", function() {
      var responseBody = uuid.v4();
      context.middleware = chai.spy(function(options, callback, next) {
        callback(null, { body: responseBody }, responseBody);
      });
      var rpmf = new RequestPromiseMiddlewareFramework(context.mockedRequestPromise, context.middleware);
      context.rp = rpmf.getMiddlewareEnabledRequestPromise();
      return context.rp(context.options)
        .then(response => {
          expect(response).to.exist.and.be.an("object");
          expect(response).to.have.property("body").and.equal(responseBody);
          expect(context.mockedRequestPromise.defaults).to.have.been.called();
          expect(context.overriddenRequest).to.have.been.called();
          expect(context.middleware).to.have.been.called();
          expect(context.mockedRequestPromise).to.not.have.been.called();
          expect(context.middlewareCallback).to.not.exist;
        });
    });
  });

  describe("Executing a request with undefined middleware", function() {
    it("should execute not execute any middleware but the request should be executed successfully", function() {
      var rpmf = new RequestPromiseMiddlewareFramework(context.mockedRequestPromise);
      context.rp = rpmf.getMiddlewareEnabledRequestPromise();
      return context.rp(context.options)
        .then(response => {
          expect(response).to.exist.and.be.an("object");
          expect(response).to.have.property("body").and.equal(context.responseBody);
          expect(context.mockedRequestPromise.defaults).to.have.been.called();
          expect(context.overriddenRequest).to.have.been.called();
          expect(context.middleware).to.not.have.been.called();
          expect(context.mockedRequestPromise).to.have.been.called();
          expect(context.middlewareCallback).to.not.exist;
        });
    });
  });

  describe("Executing a request with an empty array of middleware", function() {
    it("should execute not execute any middleware but the request should be executed successfully", function() {
      var rpmf = new RequestPromiseMiddlewareFramework(context.mockedRequestPromise, [ ]);
      context.rp = rpmf.getMiddlewareEnabledRequestPromise();
      return context.rp(context.options)
        .then(response => {
          expect(response).to.exist.and.be.an("object");
          expect(response).to.have.property("body").and.equal(context.responseBody);
          expect(context.mockedRequestPromise.defaults).to.have.been.called();
          expect(context.overriddenRequest).to.have.been.called();
          expect(context.middleware).to.not.have.been.called();
          expect(context.mockedRequestPromise).to.have.been.called();
          expect(context.middlewareCallback).to.not.exist;
        });
    });
  });
});
