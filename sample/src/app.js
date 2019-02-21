const express = require("express"),
  RequestPromiseMiddlewareFramework = require("request-promise-middleware-framework");

const middleware = [require("./testmiddleware.js")(1), require("./testmiddleware.js")(2)];
const rpMiddlewareFramework = new RequestPromiseMiddlewareFramework(require("request-promise"), middleware);
const rp = rpMiddlewareFramework.getMiddlewareEnabledRequestPromise();
const app = express();

app.get("/echo", (req, res) => {
  if (req.query.message) {
    const message = req.query.message;
    res.send(message);
  } else {
    res.status(400).send("No message specified.");
  }
});

app.get("/remote/echo", (req, res) => {
  if (req.query.message) {
    const options = {
      resolveWithFullResponse: false,
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

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log("Example app listening on port 3000!");
});
