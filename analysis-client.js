
const Acorn = require("acorn");
const AranAccess = require("aran-access");

module.exports = ({aran, argm}, callback) => {

  let wrappers = new WeakMap();

  const encode = (value) => wrappers.has(value) ?
    argm.marker + JSON.stringify(value) :
    value;

  const decode = (value) => {
    if (typeof value === "string" && value.startsWith(argm.marker)) {
      const wrapper = JSON.parse(value.substring(argm.marker));
      wrappers.set(wrapper);
      return wrapper;
    }
    return value;
  };

  const wrap = (value, origin, serial) => {
    const wrapper = {value:jsonify(value), location:location(serial), origin:origin};
    wrappers.set(wrapper, value);
    return wrapper;
  };

  const cleanup = (value) => wrappers.has(value) ? wrappers.get(value) : value;

  const access = AranAccess({enter:decode, leave:cleanup});

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

  const location = (serial) => argm.alias+"@"+aran.root(serial).source+"#"+aran.node(serial).loc.start.line+":"+aran.node(serial).loc.start.column;

  const advice = Object.assign({}, access.advice);

  advice.invoke = ($$object, $$key, array$$value, serial) => {
    const object = access.release(cleanup($$object));
    const name = object.constructor.name;
    if (name === "CanvasRenderingContext2D")
      console.log("At "+location(serial)+", context2d."+access.release(cleanup($$key))+" was called with: "+JSON.stringify(array$$value.map(jsonify)));
    if (name === "r" || name === "Socket") {
      const key = access.release(cleanup($$key));
      if (key === "emit") {
        const event = access.release(cleanup(array$$value[0]));
        membrane.leave = encode;
        const result = access.advice.invoke($$object, key, [event, array$$value[1]], serial);
        membrane.leave = cleanup;
        return result;
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

  callback(null, {
    advice: advice,
    parse: (script, source) => {
      if (source === "http://localhost:3000/main.js") {
        const estree = Acorn.parse(script, {locations:true});
        estree.source = source;
        return estree;
      }
    }
  });

};
