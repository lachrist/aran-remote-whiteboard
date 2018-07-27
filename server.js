const Chalk = require("chalk");
const Path = require("path");
const Http = require("http");
const Minimist = require("minimist");
const AranLiteBrowserProxy = require("aran-lite/browser/proxy");
const options = Minimist(process.argv.slice(2));
const stack = [];
const onrequest = (request, response) => {
  if (request.url === "/pop") {
    response.end(stack.pop());
  } else {
    const body = "";
    request.on("data", (data) => { body.push(data) });
    if (request.url === "/push") {
      request.on("end", () => { stack.push(body) });
    } else if (request.url === "/log-info") {
      request.on("end", () => { console.log(Chalk.green(body)) });
    } else if (request.url === "/log-important") {
      request.on("end", () => { console.log(Chalk.blue(body)) });
    }
  }
}
const proxy = AranLiteBrowserProxy(Path.resolve(options.analysis));
proxy.on("request", onrequest);
proxy.listen(options["browser-port"]);
const server = Http.createServer(onrequest);
server.listen(options["node-port"]);