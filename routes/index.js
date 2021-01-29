const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const multer = require("multer");
const conn = require("../config/keys").MYSQL_CONNECTION;
const storage = require("../config/fileStorage");
const upload = multer({
	storage: storage.storage,
	limits: storage.limits,
	fileFilter: storage.fileFilter,
});

// Render ejs view pages
router.get("/", (req, res) => {
	res.setHeader("Content-Type", "text/html");
	res.render("welcome", { userNameTag: "" });
});

router.get("/profiles/:id", ensureAuthenticated, (req, res, next) => {
	const id = req.params.id;
	let visitor = false;
	let liked;
	let username;

	conn.query("SELECT * FROM users WHERE id=?", [id], (err, rows) => {
		if (rows.length > 0) {
			let count = 0;
			let count2 = 0;
			let likedby = JSON.stringify(req.user.likedby).split(",");

			while (likedby[count]) {
				if (likedby[count] == rows[0].username) {
					count2++;
					break;
				}
				count++;
			}
			if (count2 == 0) username = "undefined";
			if (count2 == 1) username = rows[0].username;
		}

		let likesSql = "SELECT * FROM likes WHERE userId=? AND likedId=?";
		let likesPost = [req.user.id, id];
		conn.query(likesSql, likesPost, (err, likesRows) => {
			if (err) throw err;
			if (likesRows.length > 0) {
				liked = "liked";
			} else {
				liked = "like";
			}

			conn.query("SELECT * FROM users WHERE id=?", [id], (err, docs) => {
				if (docs.length == 0) {
					console.log("There was a weird error");
					res.end();
				} else {
					let viewsSql = "SELECT * FROM views WHERE userId=? AND viewedId=?";
					let viewsPost = [req.user.id, id];

					conn.query(viewsSql, viewsPost, (err, viewsResult) => {
						if (err) throw err;
						if (viewsResult.length == 0) {
							visitor = true;

							viewsSql = "INSERT INTO views SET ?";
							viewsPost = {
								userId: req.user.id,
								viewedId: id,
								userViewUsername: req.user.username,
							};
							conn.query(viewsSql, viewsPost, (err) => {
								if (err) throw err;
							});

							if (visitor) {
								conn.query(
									"SELECT views FROM users WHERE id=?",
									[id],
									(err, userRows) => {
										let viewCount = userRows[0].views + 1;
										conn.query(
											"UPDATE users SET views=? WHERE id=?",
											[viewCount, id],
											(err) => {
												if (err) throw err;

												conn.query(
													"SELECT * FROM users WHERE id=?",
													[id],
													(err, results) => {
														res.render("profiles", {
															user: results[0],
															liked: liked,
															userliked: username,
															curr_userUsername: req.user.username,
															curr_userId: req.user.id,
															userNameTag: req.user.username,
														});
														next();
													}
												);
											}
										);
									}
								);
							}
						} else {
							res.render("profiles", {
								user: docs[0],
								liked: liked,
								userliked: username,
								curr_userUsername: req.user.username,
								curr_userId: req.user.id,
								userNameTag: req.user.username,
							});
							res.end();
						}
					});
				}
			});
		});
	});
});

function matches(likedByUsers, likedUsers) {
	let _ = require("underscore");
	let matches = [];

	matches = _.intersection(likedByUsers, likedUsers);
	return matches;
}

router.get(
	"/chats",
	ensureAuthenticated,
	(req, res, next) => {
		const user = req.user;
		let likedUsers = [];
		let likedByUsers = [];
		let matchedUsers = [];

		conn.query("SELECT * FROM likes WHERE user_username=?", [user.username], (err, likes) => {
			if (err) throw err;
			likes.forEach((users) => {
				likedUsers.push(users.liked_username);
			});
			conn.query("SELECT * FROM likes WHERE liked_username=?", [user.username], (err, currUserliked) => {
				if (err) throw err;
				currUserliked.forEach((likedby) => {
					likedByUsers.push(likedby.user_username);
				});
				matchedUsers = matches(likedByUsers, likedUsers);
				let blocked = JSON.stringify(user.blocked).split(",");
				
				let matchedUsersTokens = new Array(matchedUsers.length).fill('?').join(',');
				let blockedTokens = new Array(blocked).fill('?').join(',');
				let allUsers = matchedUsers.concat(blocked);

				let userSql = `SELECT * FROM users WHERE username IN (${matchedUsersTokens}) AND username NOT IN (${blockedTokens})`;
				conn.query(userSql, allUsers, (err, nonBlockedUsers) => {
					if (err) throw err;
					res.locals.user = user;
					res.locals.nonBlockedUsers = nonBlockedUsers;
					next();
				});
			});
		});
	},
	(req, res, next) => {
		let nonBlockedUsers = res.locals.nonBlockedUsers;
		let user = res.locals.user;
		let chatId = req.url.split("?", 2)[1];

		let chatSql = "SELECT * FROM chats WHERE (reciever=? OR sender=?) AND (chatid=?) ORDER BY time ASC";
		let chatPost = [user.username, user.username, chatId];
		conn.query(chatSql, chatPost, (err, messages) => {
			if (err) throw err;
			res.render("chats", {
				user: user,
				chatId: chatId,
				messages: messages,
				userNameTag: req.user.username,
				nonBlockedUsers: nonBlockedUsers.map((nonBlockedUser) => {
					return {
						username: nonBlockedUser.username,
						pp: nonBlockedUser.image_1,
						lastSeen: nonBlockedUser.lastSeen,
						loggedIn: nonBlockedUser.loggedIn,
						bio: nonBlockedUser.bio,
						request: {
							url:
								"/chats?" +
								[user.username, nonBlockedUser.username].sort().join("-"),
						},
					};
				}),
			});
		});
	}
);

router.get("/suggestedMatchas", ensureAuthenticated, (req, res) => {
	let ageMax;
	let ageMin;
	switch (req.user.agePref) {
		case "age1":
			ageMin = 18;
			ageMax = 24;
			break;
		case "age2":
			ageMin = 25;
			ageMax = 31;
			break;
		case "age3":
			ageMin = 32;
			ageMax = 38;
			break;
		case "age4":
			ageMin = 39;
			ageMax = 45;
			break;
		case "age5":
			ageMin = 46;
			ageMax = 52;
			break;
		case "age6":
			ageMin = 53;
			ageMax = 59;
			break;
		case "age7":
			ageMin = 60;
			ageMax = 66;
			break;
		default:
			ageMax = 66;
			ageMin = 18;
	}
	let userSql = `SELECT * FROM users WHERE (city = ?) AND
	(interest_1 IN (?, ?, ?, ?, ?) OR interest_2 IN (?, ?, ?, ?, ?) OR interest_3 IN (?, ?, ?, ?, ?) OR interest_4 IN (?, ?, ?, ?, ?) OR interest_5 IN (?, ?, ?, ?, ?)) AND
	(gender = ? && gender = "male" OR gender = ? && gender = "female" OR gender2 = ?) AND
	(fame <= ?) AND
	(id <> ?) AND
	(age BETWEEN ? AND ?)
	ORDER BY fame DESC`;
	let userPost = [
		req.user.city,
		req.user.interest_1,
		req.user.interest_2,
		req.user.interest_3,
		req.user.interest_4,
		req.user.interest_5,
		req.user.interest_1,
		req.user.interest_2,
		req.user.interest_3,
		req.user.interest_4,
		req.user.interest_5,
		req.user.interest_1,
		req.user.interest_2,
		req.user.interest_3,
		req.user.interest_4,
		req.user.interest_5,
		req.user.interest_1,
		req.user.interest_2,
		req.user.interest_3,
		req.user.interest_4,
		req.user.interest_5,
		req.user.interest_1,
		req.user.interest_2,
		req.user.interest_3,
		req.user.interest_4,
		req.user.interest_5,
		req.user.sexPref,
		req.user.sexPref,
		req.user.sexPref,
		req.user.fame,
		req.user.id,
		ageMin,
		ageMax,
	];
	// username NOT IN (${req.user.blocked}) &&
	conn.query(userSql, userPost, (err, rows) => {
		if (err) throw err;
		res.status(200).render("suggestedMatchas", {
			userNameTag: req.user.username,
			userLat: req.user.lat,
			userLong: req.user.longitude,
			userFame: req.user.fame,
			userInterest_1: req.user.interest_1,
			userInterest_2: req.user.interest_2,
			userInterest_3: req.user.interest_3,
			userInterest_4: req.user.interest_4,
			userInterest_5: req.user.interest_5,
			users: rows.map((row) => {
				return {
					firstname: row.firstname,
					lastname: row.lastname,
					username: row.username,
					fame: row.fame,
					age: row.age,
					lat: row.lat,
					long: row.longitude,
					interest_1: row.interest_1,
					interest_2: row.interest_2,
					interest_3: row.interest_3,
					interest_4: row.interest_4,
					interest_5: row.interest_5,
					profileImage: row.image_1,
					request: {
						url: "/profiles/" + row.id,
					},
				};
			}),
		});
	});
});

// Dashboard
router.get("/dashboard", ensureAuthenticated, (req, res) => {
	let totalViews = [];
	let totalLikes = [];

	let viewSql = "SELECT * FROM views WHERE viewedId=?";
	let viewPost = [req.user.id];

	conn.query(viewSql, viewPost, (err, viewRows) => {
		let userSql = "SELECT * FROM users WHERE id=?";
		let userPost = [req.user.id];

		conn.query(userSql, userPost, (err, userRows) => {
			if (err) {
				console.log("could not find user");
			}
			let likedby = JSON.stringify(req.user.likedby);
			let userlikes = likedby.split(",");

			if (userRows.length > 0) {
				res.render("dashboard", {
					name: req.user.username,
					pp: req.user.image_1,
					country: req.user.country,
					province: req.user.province,
					city: req.user.city,
					image1: req.user.image_2,
					image2: req.user.image_3,
					image3: req.user.image_4,
					image4: req.user.image_5,
					gender: req.user.gender,
					sexPref: req.user.sexPref,
					interest_1: req.user.interest_1,
					interest_2: req.user.interest_2,
					interest_3: req.user.interest_3,
					interest_4: req.user.interest_4,
					interest_5: req.user.interest_5,
					bio: req.user.bio,
					views: req.user.views,
					likes: req.user.likes,
					fame: req.user.fame,
					age: req.user.age,
					userNameTag: req.user.username,
					userLikes: userlikes,
					userViews: viewRows,
				});
			}
		});
	});
});

// Index Controller
const IndexController = require("../controllers/index");

router.post(
	"/dashboard",
	(req, res, next) => {
		res.locals.upload = upload;
		next();
	},
	IndexController.index_dashboard
);
router.post("/profiles/:id", IndexController.index_profile);

router.post("/suggestedMatchas", IndexController.index_advancedMathas);

module.exports = router;
