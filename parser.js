class Operator {
  constructor(id, symb, evalfunc, unary=false) {
    this.id = id;
    this.symb = symb;
    this.evalfunc = evalfunc;
    this.unary = unary;
  }

  symbol_matches(word) {
    return word.type == "unparsed" && word.str == this.symb;
  }

  matches(subline) {
    if (this.unary) {
      return subline.length >= 2 && this.symbol_matches(subline[0]) && is_expression(subline[1]) ? 2 : -1;
    } else {
      return subline.length >= 3 && is_expression(subline[0]) && this.symbol_matches(subline[1]) && is_expression(subline[2]) ? 3 : -1;
    }
  }

  match_object(subline) {
    if (this.unary) {
      return { type: "operator", op: this, params: [subline[1]] };
    } else {
      return { type: "operator", op: this, params: [subline[0], subline[2]] };
    }
  }

  eval(exp, atomvals, solver) {
    let vals = exp.params.map(p => solver(p, atomvals));
    return this.evalfunc(...vals);
  }
}

function is_expression(word) {
  return word.type == "atom" || word.type == "operator";
}

const OPERATORS = [
  new Operator("not", "!", a => !a, true),
  new Operator("or", "|", (a, b) => a || b),
  new Operator("and", "&", (a, b) => a && b),
  new Operator("if", ">", (a, b) => a ? b : true),
  new Operator("iff", "=", (a, b) => a == b)
];

function parse(string) {
  let parsed = {};

  parsed.atoms = [];
  parsed.rawlines = string.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
  let lines = parsed.rawlines.map(l => l.split(/(\w+)|([^\w])/).filter(w => w));
  for (let line of lines) {
    if (line[0] != ":") {
      for (let word of line) {
        if (word.search(/[^\w]/) === -1 && !parsed.atoms.includes(word)) parsed.atoms.push(word);
      }
    }
  }
  lines = lines.map(l => l.map(w => { return { type: "unparsed", str: w } }));
  
  let is_unparsed = line => line.length > 1 || line.some(s => typeof s == "string" || s.type == "unparsed");

  parsed.premises = [];
  parsed.conclusions = [];

  parsed.atomdefs = {};

  let is_conclusion = false;
  for (let line of lines) {
    if (line[0].type == "unparsed" && line[0].str == "-") {
      is_conclusion = true;
      continue;
    }

    if (line[0].type == "unparsed" && line[0].str == ":") {
      let split = line.slice(1).map(w => w.str).join("").split(":");
      parsed.atomdefs[split[0]] = split[1].trim();
      continue;
    }

    while (is_unparsed(line)) {
      let unchanged = true;

      for (let i = 0; i < line.length; i++) {
        if (parsed.atoms.includes(line[i].str)) {
          line[i] = {
            type: "atom",
            atom: line[i].str
          }
          unchanged = false;
        }

        let sub = line.slice(i);
        for (let op of OPERATORS) {
          let len = op.matches(sub);
          if (len > -1) {
            let match = line.slice(i, i + len);
            let newObj = op.match_object(match);
            line.splice(i, len, newObj);
            unchanged = false;
          }
        }

        if (line[i].type == "unparsed" && line[i].str == "(" && is_expression(line[i+1]) && line[i+2].type == "unparsed" && line[i+2].str == ")") {
          line.splice(i, 3, line[i+1]);
          unchanged = false;
        }
      }

      if (unchanged) {
        console.log("Oops! A line was not parsed completely: ")
        console.log(line);
        break;
      }
    }

    if (is_conclusion) {
      parsed.conclusions.push(line[0]);
    } else {
      parsed.premises.push(line[0]);
    }

    parsed.lines = parsed.premises.concat(...parsed.conclusions);
  }

  return parsed;
}

module.exports.parse = parse;