const TAB = "    ";

function translate_expression(exp, nested=false) {
  if (exp.type == "atom") {
    return exp.atom;
  } else {
    let params = exp.params.map(p => translate_expression(p, true));
    let ret;
    switch (exp.op.id) {
      case "not":
        ret = "$\\lnot$ " + params[0];
        break;
      case "or":
        ret = params[0] + "$\\lor$ " + params[1];
        break;
      case "and":
        ret = params[0] + "$\\land$ " + params[1];
        break;
      case "if":
        ret = params[0] + "$\\rightarrow$ " + params[1];
        break;
      case "iff":
        ret = params[0] + "$\\leftrightarrow$ " + params[1];
        break;
    }
    return nested && params.length > 1 ? "(" + ret + ")" : ret;
  }
}

/**
 * @param {import("./argument").Argument} argument 
 * @param {*} table 
 */
function table_string(argument, table) {
  let str = `\\begin{tabular}{${Array(argument.atoms.length).fill("c").join("|") + "||" + Array(argument.premises.length).fill("c").join("|") + "||" + Array(argument.conclusions.length).fill("c").join("|")}}`;
  str += "\n" + TAB + argument.atoms.join(" & ") + " & ";
  str += argument.premises.map(p => translate_expression(p)).join(" & ") + " & ";
  str += argument.conclusions.map(c => translate_expression(c)).join(" & ");

  str += " \\\\\n" + TAB + "\\hline\n";

  let rows = [];
  for (let row of table.slice(1)) {
    rows.push(TAB + row.map(v => v === false ? "F" : (v ? "T" : " ")).join(" & "));
  }

  str += rows.join(" \\\\\n");

  str += "\n\\end{tabular}\n";

  return str;
}

function atom_defs(defs) {
  let str = "\\begin{tabular}{r l}\n";

  let defstrings = [];
  for (let atom in defs) {
    defstrings.push(TAB + atom + " & " + defs[atom]);
  }
  str += defstrings.join(" \\\\\n");

  str += "\n\\end{tabular}\n";

  return str;
}

/**
 * @param {import("./argument").Argument} argument 
 */
function validity_statement(argument) {
  let counterexample = argument.first_counterexample();
  if (counterexample == -1) {
    return "This argument is valid because there are no counterexamples.";
  } else {
    return "This argument is invalid because case " + counterexample + " is a counterexample.";
  }
}

/**
 * @param {import("./argument").Argument} argument 
 */
function full(argument, culled=true) {
  let str = "";
  if (Object.keys(argument.atomdefs).length > 0) str += atom_defs(argument.atomdefs) + "\n";
  str += table_string(argument, culled ? argument.culled_table() : argument.table);
  str += "\n\\noindent " + validity_statement(argument);

  return str;
}

module.exports.table_string = table_string;
module.exports.full = full;