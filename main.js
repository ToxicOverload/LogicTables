const Argument = require("./argument.js").Argument;
const utils = require("./utils.js");
const yargs = require("yargs");
const fs = require("fs");

const argv = yargs
  .options("f", {
    alias: "file",
    describe: "The file to read an input argument from.",
    type: "string",
    demandOption: true
  })
  .options("o", {
    alias: "output",
    describe: "The output file to put the generated LaTeX.",
    type: "string"
  })
  .help()
  .alias("help", "h")
  .argv;

let str = fs.readFileSync(argv.file).toString();
let argument = new Argument(str);

if (argv.output) {
  fs.writeFileSync(argv.output, argument.latex_string())
} else {
  console.log(argument.latex_string());
}