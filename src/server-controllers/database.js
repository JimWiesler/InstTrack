const mysql = require('mysql');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  connectionLimit: 10,
  supportBigNumbers: true });

// Get action_type records
exports.query = (sql, params, callback) => {
  // get a connection from the pool
  pool.getConnection((connErr, connection) => {
    if (connErr) { console.log(connErr); callback(true); return; }
    // make the query
    connection.query(sql, params, (queryErr, results) => {
      connection.release();
      if (queryErr) { console.log(queryErr); callback(true); return; }
      callback(false, results);
    });
  });
};
