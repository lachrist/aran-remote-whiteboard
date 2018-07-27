const Acorn = require("acorn");
const Chalk = require("chalk");
module.exports = ({aran}) => {
  const location = (serial) => aran.root(serial).alias+"@"+aran.root(serial).source+"#"+aran.node(serial).loc.start.line+":"+aran.node(serial).loc.start.column;
  const advice = {};
  advice.apply = () => {
    console.log("APPLY");
    return scope;
  };
  advice.end = (serial) => {
    console.log("END");
  };
  return ({global, argm}) => ({
    advice: advice,
    parse: (script, source) => {
      console.log("SOURCE", source);
      const estree = Acorn.parse(script, {locations:true});
      estree.source = source;
      estree.alias = argm.alias;
      return estree;
    }
  });
};