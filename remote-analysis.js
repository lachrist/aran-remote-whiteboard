
const Path = require("path");
const Acorn = require("acorn");
const AranAccess = require("aran-access");
const Chalk = require("chalk");

module.exports = ({aran, share}) => {

  const wrappers = new WeakMap();
  const cache = {};

  const wrap = (value, origin, serial) => {
    const wrapper = {value:jsonify(value), location:location(serial), origin:origin};
    wrappers.set(wrapper, value);
    return wrapper;
  };

  const access = AranAccess({
    enter: (value) => typeof value === "string" && value in cache ? cache[value] : value,
    leave: (value) => wrappers.has(value) ? wrappers.get(value) : value
  });

  const jsonify = (value) => {
    if (wrappers.has(value) || value === null || typeof value === "boolean")
      return value;
    if (typeof value === "string")
      return JSON.stringify(value);
    if (typeof value === "number")
      return (value !== value || value === -1/0 || value === 1/0) ? String(value) : value;
    if (typeof value === "symbol" || value === void 0)
      return String(value);
    if (Array.isArray(value))
      return "array";
    return typeof value;
  };

  const location = (serial) => aran.root(serial).alias+"@"+aran.root(serial).source+"#"+aran.node(serial).loc.start.line+":"+aran.node(serial).loc.start.column;

  const advice = Object.assign({}, access.advice);

  advice.invoke = ($$object, $$key, array$$value, serial) => {
    const object = access.release(access.membrane.leave($$object));
    const name = object.constructor.name;
    if (name === "CanvasRenderingContext2D")
      console.log(Chalk.blue("At "+location(serial)+", context2d."+access.release(access.membrane.leave($$key))+" was called with: "+JSON.stringify(array$$value.map(jsonify), null, 2)));
    console.log(Chalk.green("Invoking", name, access.release(access.membrane.leave($$key)), location(serial)));
    if (name === "r" || name === "Socket") {
      const key = access.release(access.membrane.leave($$key));
      if (key === "emit") {

        const token = "aran-"+Math.random().toString(36).substring(2);
        cache[token] = array$$value[1];
        array$$value[1] = token;
      }
    }
    return access.advice.invoke($$object, $$key, array$$value, serial);
  };

  advice.get = (object, key, serial) => {
    const value = access.advice.get(object, key, serial)
    if (access.release(access.membrane.leave(object)).constructor.name === "MouseEvent")
      return wrap(value, "mouse."+access.release(access.membrane.leave(key)), serial);
    return value;
  };

  advice.primitive = (primitive, serial) => wrap(
    access.advice.primitive(primitive, serial),
    "literal",
    serial);

  advice.binary = (operator, left, right, serial) => wrap(
    access.advice.binary(operator, left, right, serial),
    {binary:operator, left:jsonify(left), right:jsonify(right)},
    serial);

  advice.unary = (operator, argument, serial) => wrap(
    access.advice.unary(operator, argument, serial),
    {unary:operator, argument:jsonify(argument)},
    serial);

  return ({global, argm, transform}) => {
    const whitelist = "window" in global ? ["http://localhost:3000/main.js"] : [Path.join(__dirname, "whiteboard", "index.js")];
    return {
      advice: Object.assign({}, advice, {SANDBOX: access.capture(global)}),
      parse: (script, source) => {
        if (whitelist.includes(source)) {
          const estree = Acorn.parse(script, {locations:true});
          estree.source = source;
          estree.alias = argm.alias;
          return estree;
        }
      }
    }
  };

};
