const parser = require("./parser.js");
const utils = require("./utils.js");
const latex = require("./latex.js");

class Argument {
  constructor(str) {
    this.string = str;

    let parsed = parser.parse(str);
    Object.assign(this, parsed);

    this.generate_table();
  }

  generate_table() {
    /** @type {Object[][]} */
    this.table = [];

    let header = this.atoms.slice();
    for (let i = 0; i < this.premises.length; i++) {
      header.push(this.rawlines[i]);
    }
    for (let i = 0; i < this.conclusions.length; i++) {
      header.push(this.rawlines[i + this.premises.length + 1]);
    }
    this.table.push(header);

    for (let a = (1 << this.atoms.length) - 1; a >= 0; a--) {
      let atomvals = {};
      for (let i = 0; i < this.atoms.length; i++) {
        atomvals[this.atoms[i]] = (a & (1 << (this.atoms.length - i - 1))) > 0;
      }
      
      this.eval_state(atomvals);

      let row = [];
      for (let atom of this.atoms) {
        row.push(atomvals[atom]);
      }
      for (let line of this.lines) {
        row.push(line.val);
      }
      this.table.push(row);
    }
  }

  eval_state(atomvals) {
    for (let exp of this.lines) {
      exp.val = this.eval_exp(exp, atomvals);
    }
  }

  eval_exp(exp, atomvals) {
    if (exp.type == "atom") {
      return atomvals[exp.atom];
    } else {
      return exp.op.eval(exp, atomvals, (exp, atomvals) => this.eval_exp(exp, atomvals));
    }
  }

  culled_table() {
    let table = [];

    table.push(this.table[0]);

    let culltable = false;
    for (let row of this.table.slice(1)) {
      let culled = row.slice();
      let cullrow = false;

      for (let i = this.atoms.length + this.premises.length; i < row.length; i++) {
        if (cullrow || culltable) culled[i] = null;
        if (row[i]) cullrow = true;
      }
      for (let i = this.atoms.length; i < this.atoms.length + this.premises.length; i++) {
        if (cullrow || culltable) culled[i] = null;
        if (!row[i]) cullrow = true;
      }

      if (!cullrow) culltable = true;

      table.push(culled);
    }

    return table;
  }

  is_valid() {
    return this.first_counterexample() == -1;
  }

  first_counterexample() {
    for (let r = 1; r < this.table.length; r++) {
      let counterexample = false;
      for (let c = this.atoms.length + this.premises.length; c < this.table[0].length; c++) {
        if (!this.table[r][c]) {
          counterexample = true;
          break;
        }
      }

      if (!counterexample) continue;

      for (let c = this.atoms.length; c < this.atoms.length + this.premises.length; c++) {
        if (!this.table[r][c]) {
          counterexample = false;
          break;
        }
      }

      if (counterexample) return r;
    }

    return -1;
  }

  can_be_sound(checkvalidity=false) {
    if (checkvalidity && !this.is_valid()) return false;

    for (let r = 1; r < this.table.length; r++) {
      let rowtrue = true;
      for (let c = this.atoms.length; c < this.atoms.length + this.premises.length; c++) {
        if (!this.table[r][c]) {
          rowtrue = false;
        }
      }

      if (rowtrue) return true;
    }

    return false;
  }

  latex_string(culled=true) {
    return latex.full(this, culled);
  }

  table_string() {
    return utils.table_string(this.table);
  }
}

module.exports.Argument = Argument;