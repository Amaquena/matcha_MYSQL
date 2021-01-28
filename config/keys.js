// MySQL connection
const {db_msql_host, db_mysql_database, db_mysql_username, db_mysql_password} = require('./config');
const mysql = require('mysql2');
const con = mysql.createConnection({
	host: db_msql_host,
	user: db_mysql_username,
	password: db_mysql_password,
  });

module.exports = {
	MYSQL_CONNECTION: con,
	DATABASE_NAME: db_mysql_database
};