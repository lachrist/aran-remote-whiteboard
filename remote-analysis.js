
const Path = require("path");
const Acorn = require("acorn");
const AranAccess = require("aran-access");

module.exports = ({aran, share}) => {

  const wrappers = new WeakMap();
  const cache = {};

  const wrap = (value, origin, serial) => {
    const wrapper = {value:jsonify(value), location:location(serial), origin:origin};
    wrappers.set(wrapper, value);
    return wrapper;
  };

  const cleanup = (value) => wrappers.has(value) ? wrappers.get(value) : value;

  const access = AranAccess({
    enter: (value) => typeof value === "string" && value in cache ? (console.log("USING", value), cache[value]) : value,
    leave: cleanup
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
    const object = access.release(cleanup($$object));
    if (object.constructor.name === "CanvasRenderingContext2D")
      console.log("At "+location(serial)+", context2d."+access.release(cleanup($$key))+" was called with: "+JSON.stringify(array$$value.map(jsonify), null, 2));
    console.log("INVOKING", object.constructor.name, access.release(cleanup($$key)));
    if (object.constructor.name === "r" || object.constructor.name === "Socket") {
      const key = access.release(cleanup($$key));
      if (key === "emit") {
        const token = "aran-"+Math.random().toString(36).substring(2);
        cache[token] = array$$value[1];
        array$$value[1] = token;
        console.log("CREATE", token, location(serial));
      }
    }
    return access.advice.invoke($$object, $$key, array$$value, serial);
  };

  advice.get = (object, key, serial) => {
    const value = access.advice.get(object, key, serial)
    if (access.release(cleanup(object)).constructor.name === "MouseEvent")
      return wrap(value, "mouse."+access.release(cleanup(key)), serial);
    return value;
  };

  advice.set = (object, key, value, serial) => {
    if (access.release(cleanup(object)).constructor.name === "CanvasRenderingContext2D")
      console.log("At "+location(serial)+", context2d."+cleanup(key)+" was assigned to: "+JSON.stringify(jsonify(value)));
    return access.advice.set(object, key, value, serial);
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
    const whitelist = "window" in global ? ["http://localhost:3000/main.js"] : [Path.join(__dirname, "app", "index.js")];
    return {
      parse: (script, source) => {
        console.log("SOURCE", source, whitelist);
        if (whitelist.includes(source)) {
          const estree = Acorn.parse(script, {locations:true});
          estree.source = source;
          estree.alias = argm.alias;
          return estree;
        }
      },
      advice: Object.assign({}, advice, {SANDBOX: access.capture(global)})
    }
  };

};
