const Argument = require("./argument.js").Argument;
const utils = require("./utils.js");

let valid = new Argument(`
A>!G
M>A
---
G>!M
`);
console.assert(valid.is_valid(), `${valid.string} is invalid, should be valid`);

let invalid = new Argument(`
E>L
L
---
E
`);
console.assert(!invalid.is_valid(), `${invalid.string} is valid, should be invalid`);