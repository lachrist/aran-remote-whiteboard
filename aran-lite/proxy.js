const Path = require("path");
const AranLiteBrowserProxy = require("aran-lite/browser/proxy");
const proxy = AranLiteBrowserProxy(Path.join(__dirname, "analysis.js"), {
  "ca-home": Path.join(__dirname, "..", "..", "..", "otiluke", "browser", "ca-home")
});
proxy.listen(process.argv[2]);
proxy.on("request", (request, response) => {});
proxy.on("error", (error, location, origin) => {
  console.log(error.message+ " @"+location);
  console.log(error.stack);
});