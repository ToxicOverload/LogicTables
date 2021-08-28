const TAB = "    ";

/**
 * @param {import("./argument").Argument} argument 
 */
function explain_truthiness(exp) {
  if (exp.type == "atom") {
    return exp.atom + (exp.val ? " is true" : " is false");
  } else {
    let culled_params = exp.params;
    switch (exp.op.id) {
      case "or":
        if (params[0].val) {
          culled_params = culled_params.slice(0, 1);
        }
      default:
        break;
    }
    culled_params = culled_params.filter(p => p.type != "atom");
    let params = culled_params.map(
      p => explain_truthiness(p)
    );

    return `${translate_expression(exp)} is ${exp.val}`/*` because ${english_join(params)}`*/;
  }
}

function translate_expression(exp, nested=false) {
  if (exp.type == "atom") {
    return exp.atom;
  } else {
    let params = exp.params.map(p => translate_expression(p, true));
    let ret;
    switch (exp.op.id) {
      case "not":
        ret = "$\\lnot$" + params[0];
        break;
      case "or":
        ret = params[0] + "$\\lor$" + params[1];
        break;
      case "and":
        ret = params[0] + "$\\land$" + params[1];
        break;
      case "if":
        ret = params[0] + "$\\rightarrow$" + params[1];
        break;
      case "iff":
        ret = params[0] + "$\\leftrightarrow$" + params[1];
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
function soundness_statement(argument) {
  if (argument.is_valid()) {
    if (argument.can_be_sound()) {
      return "This argument may be sound based on its truth table, real-world context is needed to determine soundness.";
    } else {
      return "This argument is not sound despite being valid, because there is no case where the premises are all true.";
    }
  } else {
    return "This argument is not sound because it's invalid.";
  }
}

/**
 * @param {import("./argument").Argument} argument
 */
function standard_form(argument) {
  let str = "\\begin{tabular}{l}\n";

  for (let line of argument.premises) {
    str += "    " + translate_expression(line) + "\\\\\n";
  }
  str += "    \\hline\n";

  let linestrs = [];
  for (let line of argument.conclusions) {
    linestrs.push("    " + translate_expression(line));
  }
  str += linestrs.join("\\\\\n");

  str += "\n\\end{tabular}";

  return str;
}

/**
 * @param {import("./argument").Argument} argument
 */
function invalidity_proof(argument) {
  let atomvals = {};
  let row = argument.table[argument.first_counterexample()];
  for (let i = 0; i < argument.atoms.length; i++) {
    atomvals[argument.atoms[i]] = row[i];
  }
  argument.eval_state(atomvals);

  let str = "\\subsection*{Proof of Invalidity}\n";

  let conditions = row.map((e, i) => {
    if (i < argument.atoms.length) {
      return argument.atoms[i] + (e ? " is true" : " is false");
    } else if (i < argument.atoms.length + argument.premises.length) {
      return explain_truthiness(argument.premises[i - argument.atoms.length]);
    } else {
      return explain_truthiness(argument.conclusions[i - argument.atoms.length - argument.premises.length]);
    }
  });
  str += "Consider the case where " + english_join(conditions.slice(0, argument.atoms.length)) + ". ";

  str += "In this case, " + english_join(conditions.slice(argument.atoms.length)) + ". Thus, all the premises are true but the conclusion is false. This is a counterexample, so the argument is invalid.";

  return str;
}

function english_join(strings, conjunction="and") {
  switch (strings.length) {
    case 0:
      return "";
    case 1:
      return strings[0];
    case 2:
      return `${strings[0]} ${conjunction} ${strings[1]}`;
    default:
      return strings.slice(0, -1).join(", ") + ", " + conjunction + " " + strings[strings.length - 1];
  }
}

/**
 * @param {import("./argument").Argument} argument 
 */
function full(argument, culled=true) {
  let str = "\\section{}\n\\centering\n";
  if (Object.keys(argument.atomdefs).length > 0) str += atom_defs(argument.atomdefs);
  str += standard_form(argument) + "\n\n";
  str += table_string(argument, culled ? argument.culled_table() : argument.table);
  str += "\n\\justifying\n\\noindent " + validity_statement(argument);
  str += "\n\n\\noindent " + soundness_statement(argument);

  if (!argument.is_valid()) {
    str += "\n\n" + invalidity_proof(argument);
  }

  return str;
}

module.exports.table_string = table_string;
module.exports.full = full;