const Path = require("path");
const Http = require("http");
const Minimist = require("minimist");
const AranLiteBrowserProxy = require("aran-lite/browser/proxy");

const options = Minimist(process.argv.slice(2));
const stack = [];
const onrequest = (request, response) => {
  if (request.method === "GET") {
    response.end(stack.pop());
  } else {
    const body = "";
    request.on("data", (data) => { body.push(data) });
    request.on("end", () => { stack.push(body) });
  }
}

const proxy = AranLiteBrowserProxy(Path.resolve(options.analysis));
proxy.on("request", onrequest);
proxy.listen(options["browser-port"]);

const server = Http.createServer(onrequest);
server.listen(options["node-port"]);
