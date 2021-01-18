// MongoDB connection
// const { db_mongo_port, db_mongo_host, db_mongo_name, db_mongo_ip, db_mongo_username, db_mongo_password }= require('./config');

// module.exports = {
// 	MongoURI: `${db_host}://${db_ip}:${db_port}/${db_name}`
// };

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