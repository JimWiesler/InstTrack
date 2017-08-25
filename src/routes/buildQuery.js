function valFormat(value) {
  if (value === null) return 'null';
  return `'${value}'`;
}

function buildQuery(table, idField, fields) {
  const keys = Object.keys(fields);
  let sql = '';
  if (typeof fields[idField] === 'undefined' || fields[idField] === null) { // INSERT query: INSERT INTO action (f1, f2) VALUES ('3', 'a');
    let cols = '';
    let vals = '';
    let sep = '';
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] !== idField) {
        cols += `${sep}${keys[i]}`;
        vals += `${sep}${valFormat(fields[keys[i]])}`;
        sep = ', ';
      }
    }
    sql = `INSERT INTO ${table} (${cols}) VALUES (${vals});`;
  } else { // UPDATE query: UPDATE action SET revision='B', reviewer='Mike' WHERE idaction='1';
    let valPairs = '';
    let sep = '';
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] !== idField) {
        valPairs += `${sep}${keys[i]}=${valFormat(fields[keys[i]])}`;
        sep = ', ';
      }
    }
    sql = `UPDATE ${table} SET ${valPairs} WHERE ${idField}='${fields[idField]}';`;
  }
  return sql;
}

module.exports = buildQuery;
