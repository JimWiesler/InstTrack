'use strict';

function valFormat(value) {
  if (value === null) return 'null';
  return '\'' + value + '\'';
}

function buildQuery(table, idField, fields) {
  var keys = Object.keys(fields);
  var sql = '';
  if (typeof fields[idField] === 'undefined' || fields[idField] === null) {
    // INSERT query: INSERT INTO action (f1, f2) VALUES ('3', 'a');
    var cols = '';
    var vals = '';
    var sep = '';
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== idField) {
        cols += '' + sep + keys[i];
        vals += '' + sep + valFormat(fields[keys[i]]);
        sep = ', ';
      }
    }
    sql = 'INSERT INTO ' + table + ' (' + cols + ') VALUES (' + vals + ');';
  } else {
    // UPDATE query: UPDATE action SET revision='B', reviewer='Mike' WHERE idaction='1';
    var valPairs = '';
    var _sep = '';
    for (var _i = 0; _i < keys.length; _i++) {
      if (keys[_i] !== idField) {
        valPairs += '' + _sep + keys[_i] + '=' + valFormat(fields[keys[_i]]);
        _sep = ', ';
      }
    }
    sql = 'UPDATE ' + table + ' SET ' + valPairs + ' WHERE ' + idField + '=\'' + fields[idField] + '\';';
  }
  return sql;
}

module.exports = buildQuery;