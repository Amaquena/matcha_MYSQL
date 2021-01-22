const multer = require("multer");
const crypto = require("crypto-extra");
// const User = require("../models/User");
// const Likes = require("../models/Likes");
const conn = require("../config/keys").MYSQL_CONNECTION;
const Chats = require("../models/Chats");
// const { connect } = require("../app");

exports.index_dashboard = (req, res, next) => {
	let uploads = res.locals.upload.fields([
		{
			name: "image1",
			maxCount: 1,
		},
		{
			name: "image2",
			maxCount: 1,
		},
		{
			name: "image3",
			maxCount: 1,
		},
		{
			name: "image4",
			maxCount: 1,
		},
	]);
	uploads(req, res, async function (err) {
		if (err instanceof multer.MulterError) {
			req.flash("error_msg", err);
			return res.status(500).redirect("/dashboard");
		} else if (err) {
			req.flash("error_msg", err);
			return res.status(500).redirect("/dashboard");
		}

		let sqlPost = null;
		if (req.files["image1"]) {
			sqlPost = { image_2: req.files["image1"][0].filename };
		} else if (req.files["image2"]) {
			sqlPost = { image_3: req.files["image2"][0].filename };
		} else if (req.files["image3"]) {
			sqlPost = { image_4: req.files["image3"][0].filename };
		} else if (req.files["image4"]) {
			sqlPost = { image_5: req.files["image4"][0].filename };
		}

		let userSql = "UPDATE users SET ?";
		await conn.query(userSql, sqlPost, (err) => {
			if (err) {
				req.flash("error_msg", err);
				return res.status(500).redirect("/dashboard");
			}
			req.flash("success_msg", "Successfully updated picture.");

			res.redirect("/dashboard");
		});
	});
};

exports.index_profile = (req, res, next) => {
	const id = req.params.id;
	const currUser = req.user;

	if (req.body.like_btn === "like_btn") {
		conn.query("SELECT * FROM users WHERE id=?", [id], (err, doc) => {
			if (err) throw err;

			if (doc.length > 0) {
				let likesPost = [currUser.username, doc[0].username];
				conn.query(
					"SELECT * FROM likes WHERE user_username=? AND liked_username=?",
					likesPost,
					(err, isLiked) => {
						if (err) throw err;

						if (isLiked.length > 0) {
							res.redirect("/profiles/" + id);
						} else {
							let likedby = [];
							let blocked = [];
							let updateLikes = doc[0].likes + 1;

							if (doc[0].likedby != null) {
								likedby = JSON.stringify(doc[0].likedby).split(",");
							}
							if (doc[0].blocked != null) {
								blocked = JSON.stringify(doc[0].blocked).split(",");
							}

							likedby.push(currUser.username);
							const index = blocked.indexOf(currUser.username);
							if (index > -1) {
								blocked.splice(index, 1);
							}
							let likedbyString = likedby.join().replace(/['"]+/g, '');
							let blockedString = blocked.join().replace(/['"]+/g, '');
							let userPost = [likedbyString, blockedString, updateLikes, id];
							conn.query("UPDATE users SET likedby=?, blocked=?, likes=? WHERE id=?", userPost, (err) => {
								if (err) throw err;
								
								conn.query("SELECT blocked FROM users WHERE id=?", [currUser.id], (err, currentUserDoc) => {
									if (err) throw err;
									blocked = JSON.stringify(currentUserDoc[0].blocked).split(",");
									const index = blocked.indexOf(doc[0].username);
									if (index > -1) {
										blocked.splice(index, 1);
									}
									blockedString = blocked.join();
									conn.query("UPDATE users SET blocked=? WHERE id=?", [blockedString, currUser.id], (err) => {
										if (err) throw err;

										let likesSql = "INSERT INTO likes SET ?";
										let likesPost = {
											userId: currUser.id,
											likedId: id,
											user_username: currUser.username,
											liked_username: doc[0].username,};
										conn.query(likesSql, likesPost, (err) => {
											if (err) throw err;
											res.redirect("/profiles/" + id);
										});
									});
								});
							});
						}
					}
				);
			}
		});
	} else if (req.body.block_btn === "block_btn") {
		const id = req.params.id;
		const currUser = req.user;
		let blockedUser = false;

		conn.query("SELECT * FROM users WHERE id=?", [id], (err, userRows) => {
			if (err) throw err;

			let blocked = [];
			let likedby = [];
			let userLikes;

			if (userRows[0].blocked != null) {
				blocked = JSON.stringify(userRows[0].blocked).split(",");
			}
			for (const i in blocked) {
				if (blocked.hasOwnProperty(i)) {
					blockedUser = true;
				}
			}

			if (!blockedUser) {
				if (userRows[0].likes > 0) {
					userLikes = userRows[0].likes - 1;
				}
				blocked.push(currUser.username);

				if (userRows[0].likedby != null) {
					likedby = JSON.stringify(userRows[0].likedby).split(",");
				}
				const index = likedby.indexOf(currUser.username);
				if (index > -1) {
					likedby.splice(index, 1);
				}

				let likedbyString = likedby.join().replace(/['"]+/g, '');
				let blockedString = blocked.join().replace(/['"]+/g, '');
				let userPost = [likedbyString, blockedString, userLikes, id];
				conn.query("UPDATE users SET likedby=?, blocked=?, likes=? WHERE id=?", userPost, (err) => {
					if (err) throw err;

					conn.query("SELECT * FROM users WHERE id=?", [currUser.id], (err, rows) => {
						blocked = [];
						if (rows[0].blocked != null) {
							blocked = JSON.stringify(rows[0].blocked).split(",");
						}
						blocked.push(userRows[0].username);
						blockedString = blocked.join().replace(/['"]+/g, '');

						userPost = [blockedString, currUser.id];
						conn.query("UPDATE users SET blocked=? WHERE id=?", userPost, (err) => {
							if (err) throw err;

							conn.query("DELETE FROM likes WHERE user_username=? AND liked_username=?", [currUser.username, userRows[0].username], (err) => {
								if (err) throw err;
								res.redirect("/profiles/" + id);
							});
						});
					});
				});
			} else {
				res.redirect("/profiles/" + id);
			}
		});
	}
};

exports.index_advancedMathas = (req, res) => {
	const search = req.body.search;

	if (req.body.sSubmit === "sSubmit") {
		let userSql = "SELECT * FROM users WHERE username=? AND username <> ?";
		let userPost = [search, req.user.username];

		conn.query(userSql, userPost, (err, rows) => {
			if (err) throw err;
			res.status(200).render("suggestedMatchas", {
				userNameTag: req.user.username,
				userLat: req.user.lat,
				userLong: req.user.longitude,
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
	} else if (req.body.aSubmit === "aSubmit") {
		const agePref = req.body.age_preference;
		const interests = req.body.interests;
		const fameRange = req.body.fameRange;
		const loc = req.body.loc;

		let ageMin;
		let ageMax;
		let userSql = "SELECT * FROM users WHERE";
		let userPost = "";

		switch (agePref) {
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
		userSql += " (age BETWEEN ? AND ?) AND";
		userPost = [ageMin, ageMax];

		let fameRangeArray = fameRange.split("-");
		userSql += " (fame BETWEEN ? AND ?) AND";
		userPost = [ageMin, ageMax, fameRangeArray[0], fameRangeArray[1]];

		let location;
		switch (loc) {
			case "near":
				location = req.user.city;
				userSql += " (city = ?) AND";
				break;
			case "far":
				location = req.user.province;
				userSql += " (province = ?) AND";
				break;
			case "any":
				location = req.user.country;
				userSql += " (country = ?) AND";
				break;
			default:
				location = null;
		}
		userPost = [ageMin, ageMax, fameRangeArray[0], fameRangeArray[1], location];

		userSql +=
			" (gender = ? && gender = 'male' OR gender = ? && gender = 'female' OR gender2 = ?)";
		userPost = [
			ageMin,
			ageMax,
			fameRangeArray[0],
			fameRangeArray[1],
			location,
			req.user.sexPref,
			req.user.sexPref,
			req.user.sexPref,
		];

		if (typeof interests !== "undefined") {
			if (Array.isArray(interests)) {
				userSql +=
					" AND (interest_1 IN (?, ?, ?, ?, ?) OR interest_2 IN (?, ?, ?, ?, ?) OR interest_3 IN (?, ?, ?, ?, ?) OR interest_4 IN (?, ?, ?, ?, ?) OR interest_5 IN (?, ?, ?, ?, ?))";
				userPost = [
					ageMin,
					ageMax,
					fameRangeArray[0],
					fameRangeArray[1],
					location,
					req.user.sexPref,
					req.user.sexPref,
					req.user.sexPref,
					interests[0],
					interests[1],
					interests[2],
					interests[3],
					interests[4],
					interests[0],
					interests[1],
					interests[2],
					interests[3],
					interests[4],
					interests[0],
					interests[1],
					interests[2],
					interests[3],
					interests[4],
					interests[0],
					interests[1],
					interests[2],
					interests[3],
					interests[4],
					interests[0],
					interests[1],
					interests[2],
					interests[3],
					interests[4],
				];
			} else {
				userSql +=
					" AND (interest_1 = ?) OR (interest_2 = ?) OR (interest_3 = ?) OR (interest_4 = ?) OR (interest_5 = ?)";
				userPost = [
					ageMin,
					ageMax,
					fameRangeArray[0],
					fameRangeArray[1],
					location,
					req.user.sexPref,
					req.user.sexPref,
					req.user.sexPref,
					interests,
					interests,
					interests,
					interests,
					interests,
				];
			}
		} else {
			// Leave it empty becuase none was selected.
		}

		conn.query(userSql, userPost, (err, rows) => {
			if (err) throw err;
			res.status(200).render("suggestedMatchas", {
				userNameTag: req.user.username,
				userLat: req.user.lat,
				userLong: req.user.longitude,
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
	}
};
