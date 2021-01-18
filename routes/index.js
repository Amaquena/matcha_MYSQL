const express = require("express");
const router = express.Router();
// const User = require("../models/User");
// const Chat = require("../models/Chats");
// const Likes = require("../models/Likes");
// const Views = require("../models/Views");
const { ensureAuthenticated } = require("../config/auth");
const multer = require("multer");
// const mongoose = require("mongoose");
const conn = require("../config/keys").MYSQL_CONNECTION;
const dummyData = require("../faker");
const storage = require("../config/fileStorage");
const upload = multer({
	storage: storage.storage,
	limits: storage.limits,
	fileFilter: storage.fileFilter,
});

// Render ejs view pages
router.get("/", (req, res) => {
	res.setHeader("Content-Type", "text/html");
	//dummyData.fake();
	res.render("welcome", { userNameTag: "" });
});

router.get("/profiles/:id", ensureAuthenticated, (req, res, next) => {
	const id = req.params.id;
	let visitor = false;
	let liked;
	User.findOne({ _id: id }).then((userInfo) => {
		if (userInfo) {
			let count = 0;
			let count2 = 0;
			while (req.user.likedby[count]) {
				if (req.user.likedby[count] == userInfo.username) {
					count2++;
					break;
				}
				count++;
			}
			if (count2 == 0) username = "undefined";
			if (count2 == 1) username = userInfo.username;
		}
		Likes.findOne({ _userId: req.user.id, likedId: id })
			.exec()
			.then((doc) => {
				if (doc) {
					liked = "liked";
				} else {
					liked = "like";
				}
			})
			.catch((err) => {
				console.log(err);
				res.end();
			});

		User.findById(id)
			.exec()
			.then((docs) => {
				if (!docs) {
					console.log("There was a weird error");
					res.end();
				} else {
					Views.findOne(
						{ $and: [{ _userId: req.user.id }, { viewedId: id }] },
						(err, doc) => {
							if (err) throw err;

							if (!doc) {
								visitor = true;

								const newView = new Views({
									_userId: req.user.id,
									viewedId: id,
									userViewUsername: req.user.username,
								});

								newView.save((err) => {
									if (err) throw err;
								});
							}
							if (visitor) {
								let query = { $inc: { views: 1 } };
								User.findByIdAndUpdate(id, query, { new: true })
									.exec()
									.then((doc) => {
										res.render("profiles", {
											user: doc,
											liked: liked,
											userliked: username,
											curr_userUsername: req.user.username,
											curr_userId: req.user.id,
											userNameTag: req.user.username,
										});
										next();
									})
									.catch((err) => {
										console.log("catch err: " + err);
									});
							}
						}
					)
						.exec()
						.then(() => {
							if (!visitor) {
								if (docs) {
									res.render("profiles", {
										user: docs,
										liked: liked,
										userliked: username,
										curr_userUsername: req.user.username,
										curr_userId: req.user.id,
										userNameTag: req.user.username,
									});
									res.end();
								}
							}
						})
						.catch((err) => {
							console.log(err);
						});
				}
			})
			.catch((err) => {
				console.log(err);
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

		Likes.find({ user_username: user.username }, (err, likes) => {
			likes.forEach((users) => {
				likedUsers.push(users.liked_username);
			});
			Likes.find({ liked_username: user.username }, (err, currUserliked) => {
				currUserliked.forEach((likedby) => {
					likedByUsers.push(likedby.user_username);
				});
				matchedUsers = matches(likedByUsers, likedUsers);
				User.find(
					{ username: { $in: matchedUsers, $nin: user.blocked } },
					(err, nonBlockedUsers) => {
						res.locals.user = user;
						res.locals.nonBlockedUsers = nonBlockedUsers;
						next();
					}
				);
			});
		});
	},
	(req, res, next) => {
		let nonBlockedUsers = res.locals.nonBlockedUsers;
		let user = res.locals.user;
		let chatId = req.url.split("?", 2)[1];

		Chat.find({
			$and: [
				{ $or: [{ to: user.username }, { from: user.username }] },
				{ chatId: chatId },
			],
		})
			.sort({ time: 1 })
			.then((messages) => {
				res.render("chats", {
					user: user,
					chatId: chatId,
					messages: messages,
					userNameTag: req.user.username,
					nonBlockedUsers: nonBlockedUsers.map((nonBlockedUser) => {
						return {
							username: nonBlockedUser.username,
							pp: nonBlockedUser.profileImages.image1,
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
	User.find({
		$and: [
			// change $or back to $and for suggested searches
			{
				city: req.user.city,
			},
			{
				$or: [
					{
						"interests.first": {
							$in: [
								req.user.interests["first"],
								req.user.interests["second"],
								req.user.interests["third"],
								req.user.interests["fourth"],
								req.user.interests["fifth"],
							],
						},
					},
					{
						"interests.second": {
							$in: [
								req.user.interests["first"],
								req.user.interests["second"],
								req.user.interests["third"],
								req.user.interests["fourth"],
								req.user.interests["fifth"],
							],
						},
					},
					{
						"interests.third": {
							$in: [
								req.user.interests["first"],
								req.user.interests["second"],
								req.user.interests["third"],
								req.user.interests["fourth"],
								req.user.interests["fifth"],
							],
						},
					},
					{
						"interests.fourth": {
							$in: [
								req.user.interests["first"],
								req.user.interests["second"],
								req.user.interests["third"],
								req.user.interests["fourth"],
								req.user.interests["fifth"],
							],
						},
					},
					{
						"interests.fifth": {
							$in: [
								req.user.interests["first"],
								req.user.interests["second"],
								req.user.interests["third"],
								req.user.interests["fourth"],
								req.user.interests["fifth"],
							],
						},
					},
				],
			},
			{
				$or: [
					{
						$and: [
							{ gender: { $eq: req.user.sexPref } },
							{ gender: { $eq: "male" } },
						],
					},
					{
						$and: [
							{ gender: { $eq: req.user.sexPref } },
							{ gender: { $eq: "female" } },
						],
					},
					{ gender2: { $eq: req.user.sexPref } },
				],
			},
			{
				fame: { $lte: parseInt(req.user.fame) },
			},
			{ _id: { $ne: req.user.id } },
			{ username: { $nin: req.user.blocked } },
			{ agePref: { $eq: req.user.agePref } },
		],
	})
		.sort({ fame: -1 })
		.select(
			"firstname lastname username profileImages.image1 fame age lat long interests"
		)
		.exec()
		.then((docs) => {
			res.status(200).render("suggestedMatchas", {
				userNameTag: req.user.username,
				userLat: req.user.lat,
				userLong: req.user.long,
				userInterests: req.user.interests,
				users: docs.map((doc) => {
					return {
						firstname: doc.firstname,
						lastname: doc.lastname,
						username: doc.username,
						fame: doc.fame,
						age: doc.age,
						lat: doc.lat,
						long: doc.long,
						interests: doc.interests,
						profileImage: doc.profileImages.image1,
						request: {
							url: "/profiles/" + doc.id,
						},
					};
				}),
			});
		})
		.catch();
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
					userLikes: req.user.likedby,
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
