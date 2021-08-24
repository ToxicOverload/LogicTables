function table_string(table) {
  let ret = " " + table[0].join(" | ") + " \n";
  let dividers = [];
  for (let entry of table[0]) {
    dividers.push("-".repeat(entry.length + 2));
  }
  ret += dividers.join("+") + "\n";
  for (let row of table.slice(1)) {
    let datastrings = [];
    for (let i = 0; i < row.length; i++) {
      datastrings.push((" " + (row[i] === false ? 0 : (row[i] ? 1 : " "))).padEnd(table[0][i].length + 2));
    }
    ret += datastrings.join("|") + "\n";
  }
  return ret;
}

module.exports.table_string = table_string;