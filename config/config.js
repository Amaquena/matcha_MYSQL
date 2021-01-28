module.exports = {
	port: process.env.PORT,
	
	db_msql_host: process.env.MATCHA__MYSQL_HOST,
	db_mysql_database: process.env.MATCHA_MYSQL_DATABASE,
	db_mysql_username: process.env.MATCHA_MYSQL_USERNAME,
	db_mysql_password: process.env.MATCHA_MYSQL_PASSWORD,

	gmail_email: process.env.GMAIL_EMAIL,
	gmail_password: process.env.GMAIL_PASSWORD
};