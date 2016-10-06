var express                           = require("express"),
    RequestPromiseMiddlewareFramework = require("request-promise-middleware-framework");

var middleware = [ require("./testmiddleware.js")(1), require("./testmiddleware.js")(2) ];
var rpMiddlewareFramework = new RequestPromiseMiddlewareFramework(require("request-promise"), middleware);
var rp = rpMiddlewareFramework.getMiddlewareEnabledRequestPromise();
var app = express();

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
