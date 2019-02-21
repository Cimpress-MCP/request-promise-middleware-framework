const _ = require("lodash");

module.exports = num => {
  return (options, callback, next) => {
    // eslint-disable-next-line no-console
    console.log(`Intercepting request with middleware ${num}.`);
    if (_.at(options, "qs.message")) {
      options.qs.message += ` (intercepted at request time by middleware ${num})`;
    }
    const _callback = (err, response) => {
      // eslint-disable-next-line no-console
      console.log(`Intercepting response with middleware ${num}.`);
      response.body += ` (intercepted at response time by middleware ${num})`;
      callback(err, response, response.body);
    };
    next(options, _callback);
  };
};
