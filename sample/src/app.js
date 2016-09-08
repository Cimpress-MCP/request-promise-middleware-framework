var express                   = require("express"),
    RequestPromiseInterceptor = require("request-promise-interceptor");

var interceptors = [ require("./testinterceptor.js")(1), require("./testinterceptor.js")(2) ];
var requestPromiseInterceptor = new RequestPromiseInterceptor(require("request-promise"), interceptors);
var rp = requestPromiseInterceptor.getInterceptedRequestPromise();
var app = express();

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.get("/echo", function(req, res) {
  if (req.query.message) {
    var message = req.query.message;
    res.send(message);
  } else {
    res.status(400).send("No message specified.");
  }
});

app.get("/remote/echo", function(req, res) {
  if (req.query.message) {
    var options = {
      uri: "http://localhost:3000/echo",
      qs: {
        message: req.query.message
      }
    };
    rp(options).then(body => res.send(body));
  } else {
    res.status(400).send("No message specified.");
  }
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
