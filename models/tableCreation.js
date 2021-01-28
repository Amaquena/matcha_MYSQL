let createUserTable = `CREATE TABLE IF NOT EXISTS users (
	id int primary key auto_increment,
	firstname varchar(255) NOT NULL,
	lastname varchar(255) NOT NULL,
	username TINYTEXT NOT NULL,
	email varchar(255) NOT NULL UNIQUE,
	password varchar(255) NOT NULL,
	dob DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	creationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
	verified boolean DEFAULT false,
	extendedProf boolean default false,
	passwordResetToken varchar(255),
	passwordResetExpires DATE,
	bio varchar(255),
	agePref varchar(255),
	gender varchar(255),
	fame int DEFAULT 0,
	likes int DEFAULT 0,
	views int DEFAULT 0,
	age int,
	sexPref varchar(255) DEFAULT "bisexual",
	interest_1 varchar(255),
	interest_2 varchar(255),
	interest_3 varchar(255),
	interest_4 varchar(255),
	interest_5 varchar(255),
	image_1 varchar(255),
	image_2 varchar(255),
	image_3 varchar(255),
	image_4 varchar(255),
	image_5 varchar(255),
	country varchar(255),
	province varchar(255),
	city varchar(255),
	lat varchar(255),
	longitude varchar(255),
	gender2 TINYTEXT,
	likedby MEDIUMTEXT,
	blocked MEDIUMTEXT,
	viewedby MEDIUMTEXT,
	loggedIn boolean,
	lastSeen TINYTEXT
);`;

exports.createUserTable = (conn) => {
	conn.query(createUserTable, (err) => {
		if (err) throw err;
		console.log("User table successfully created.");
	});
};

let createTokenTable = `CREATE TABLE IF NOT EXISTS tokens (
	id int primary key auto_increment,
	token varchar(255) NOT NULL,
	createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	userId int NOT NULL
	);`;

exports.createTokenTable = (conn) => {
	conn.query(createTokenTable, (err) => {
		if (err) throw err;
		console.log("Token table successfully created.");
	});
};

let createViewsTable = `CREATE TABLE IF NOT EXISTS views (
	id int primary key auto_increment,
	userId int NOT NULL,
	viewedId int NOT NULL,
	userViewUsername varchar(255)
	);`;

exports.createViewsTable = (conn) => {
	conn.query(createViewsTable, (err) => {
		if (err) throw err;
		console.log("Views table successfully created.");
	});
};

let createLikesTable = `CREATE TABLE IF NOT EXISTS likes (
	id int primary key auto_increment,
	userId int NOT NULL,
	likedId int NOT NULL,
	user_username varchar(255),
	liked_username varchar(255)
);`;

exports.createLikesTable = (conn) => {
	conn.query(createLikesTable, (err) => {
		if (err) throw err;
		console.log("Likes table successfully created.");
	});
};

let createChatsTable = `CREATE TABLE IF NOT EXISTS chats (
	id int primary key auto_increment,
	reciever varChar(255),
	sender varchar(255),
	msgTime varchar(255),
	message TEXT,
	chatId varchar(255),
	time DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

exports.createChatsTable = (conn) => {
	conn.query(createChatsTable, (err) => {
		if (err) throw err;
		console.log("Chats table successfully created.");
	});
};
