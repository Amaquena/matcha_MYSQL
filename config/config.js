module.exports = {
	port: process.env.PORT,
	db_mongo_username: process.env.MATCHA_MONGODB_USERNAME,
	db_mongo_password: process.env.MATCHA_MONGODB_PASSWORD,
	db_mongo_host: process.env.MATCHA_MONGODB_HOST,
	db_mongo_ip: process.env.MATCHA_MONGODB_IP,
	db_mongo_port: process.env.MATCHA_MONGODB_PORT,
	db_mongo_name: process.env.MATCHA_MONGODB_DATABASE,

	db_msql_host: process.env.MATCHA__MYSQL_HOST,
	db_mysql_database: process.env.MATCHA_MYSQL_DATABASE,
	db_mysql_username: process.env.MATCHA_MYSQL_USERNAME,
	db_mysql_password: process.env.MATCHA_MYSQL_PASSWORD,

	gmail_email: process.env.GMAIL_EMAIL,
	gmail_password: process.env.GMAIL_PASSWORD
};