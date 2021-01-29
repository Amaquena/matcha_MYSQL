const bcrypt = require("bcryptjs");
const passport = require("passport");
const conn = require("../config/keys").MYSQL_CONNECTION;
const crypto = require("crypto-extra");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { gmail_email, gmail_password } = require("../config/config");

const transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	auth: {
		user: gmail_email,
		pass: gmail_password,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

exports.user_register = (req, res) => {
	const { password, pwd_repeat } = req.body;
	const username = req.body.username.trim();
	const email = req.body.email.trim();
	const firstname = req.body.firstname.trim();
	const lastname = req.body.lastname.trim();
	const errors = [];

	let lowercase = new RegExp("^(?=.*[a-z])");
	let uppercase = new RegExp("^(?=.*[A-Z])");
	let numeric = new RegExp("^(?=.*[0-9])");
	let spcharacter = new RegExp("^(?=.*[!@#$%^&*])");

	// Check required fileds
	if (!username || !email || !password || !pwd_repeat) {
		errors.push({ msg: "Please fill in all fields" });
	}

	// Check passwords match
	if (password != pwd_repeat) {
		errors.push({ msg: "Passwords do not match" });
	}

	// Check pwd length
	if (password.length < 8) {
		errors.push({ msg: "Password should be at least 8 characters" });
	}

	if (!lowercase.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 lowercase character",
		});
	}

	if (!uppercase.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 uppercase character",
		});
	}

	if (!numeric.test(password)) {
		errors.push({ msg: "Password should contain at least 1 numeric value" });
	}

	if (!spcharacter.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 special character",
		});
	}

	if (errors.length > 0) {
		res.status(400).render("register", {
			errors,
			username,
			firstname,
			lastname,
			email,
			userNameTag: "",
		});
	} else {
		// Validation pass
		conn.query(
			"SELECT * FROM users WHERE username = ? AND email = ?",
			[username, email],
			(err, results) => {
				if (err) throw err;
				if (results.length > 0) {
					// User exists
					errors.push({ msg: "Email/Username already Registered" });
					res.status(400).render("register", {
						errors,
						username,
						email,
						firstname,
						lastname,
						userNameTag: "",
					});
				} else {
					// Validation pass

					// Hash pwd
					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(password, salt, (err, hash) => {
							if (err) {
								return res.status(500).send({ msg: err.message });
							}
							// Set password to hashed
							let newPassword = hash;
							let token = crypto.randomKey(32);
							// Save user
							let userPost = {
								firstname: firstname,
								lastname: lastname,
								email: email,
								username: username,
								password: newPassword,
							};
							let userSql = "INSERT INTO users SET ?";
							conn.query(userSql, userPost, (err) => {
								if (err) throw err;
								userSql = "SELECT id FROM users WHERE email=?";
								userPost = [email];
								conn.query(userSql, userPost, (err, rows) => {
									if (err) throw err;
									let tokenSql = "INSERT INTO tokens SET ?";
									let tokenPost = { token: token, userId: rows[0].id };
									conn.query(tokenSql, tokenPost, (err) => {
										if (err) {
											return res.status(500).send({ msg: err.message });
										}
									});
								});
							});
							// Define email content
							const mailOptions = {
								from: '"Admin" <no-reply@matcha.com>',
								to: email,
								subject: "Account Verification",
								text:
									"Hello,\n\n" +
									"Please verify your account by clicking the link: \nhttp://" +
									req.headers.host +
									"/users/confirmation/" +
									token +
									".\n",
							};

							// Send email
							transporter.sendMail(mailOptions, (err) => {
								if (err) {
									return res.status(500).send({ msg: err.message });
								}
								res.status(200).render("login", {
									success_msg:
										"Account created. Check your email to verify your account to log in.",
									userNameTag: "",
								});
							});
						});
					});
				}
			}
		);
	}
};

exports.user_login = (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) {
			return console.log(err);
		}

		if (!user) {
			return res.render("login", { message: info.message, userNameTag: "" });
		}

		req.logIn(user, (err) => {
			if (!user.extendedProf) {
				return res.redirect("/users/extendedProfile");
			}
			if (err) {
				return console.log(err);
			}

			let num;
			let fame = 0;
			if (user.views !== 0 || user.likes !== 0) {
				num = (user.likes / user.views) * 5;
				fame = Math.round(num * 10) / 10;

			}
			let userSql = "UPDATE users SET fame=?, loggedIn=? WHERE id=?";
			let userPost = [fame, 1, req.user.id];
			conn.query(userSql, userPost, (err) => {
				if (err) return console.log(err);
				return res.redirect("/dashboard");
			});
		});
	})(req, res, next);
};

exports.user_logout = (req, res) => {
	let time = getDateTime();
	let userPost = [0, time, req.user.id];
	let userSql = "UPDATE users SET loggedIn=?, lastseen=? WHERE id=?";

	conn.query(userSql, userPost, (err, rows) => {
		if (err) throw err;
		req.logout();
		req.flash("success_msg", "You are logged out");
		res.redirect("/users/login");
	});
};

exports.user_confirmation = (req, res) => {
	let tokenSql = "SELECT userId FROM tokens WHERE token=?";
	let tokenPost = [req.params.userToken];

	conn.query(tokenSql, tokenPost, (err, rows) => {
		if (err) {
			return res.status(500).send({ msg: err.message });
		}

		if (rows.length == 0)
			return res.status(404).render("login", {
				error: "We could not find the token. Your token might have expired",
				userNameTag: "",
			});
		let userSql = "SELECT verified FROM users WHERE id=?";
		let userPost = [rows[0].userId];

		conn.query(userSql, userPost, (err, rows) => {
			if (err) throw err;

			if (rows.length == 0) {
				return res.status(404).render("login", {
					error: "We were unable to find a user for this token.",
					userNameTag: "",
				});
			}

			if (rows[0].verified == true) {
				return res.status(400).render("login", {
					error: "This user has already been verified.",
					userNameTag: "",
				});
			}

			userSql = "UPDATE users SET verified=?";
			userPost = [true];

			conn.query(userSql, userPost, (err) => {
				if (err) return res.status(500).send({ msg: err.message });
				return res.status(200).render("login", {
					success_msg: "Your account has been verified. You may now log in.",
					userNameTag: "",
				});
			});
		});
	});
};

exports.user_tokenResend = (req, res) => {
	const email = req.body.email;
	const errors = [];

	if (!email) errors.push({ msg: "Please fill in all fields" });

	if (errors.length > 0)
		res.status(400).render("resend", { errors, userNameTag: "" });
	else {
		let userSql = "SELECT id, verified, email FROM users WHERE email=?";
		let userPost = [email];

		conn.query(userSql, userPost, (err, userRows) => {
			if (err) {
				return res.status(500).send({ msg: err.message });
			}
			if (userRows.length == 0)
				return res.status(400).render("resend", {
					error_msg: "We were unable to find a user with that email.",
					userNameTag: "",
				});
			if (userRows[0].verified)
				return res.status(400).render("resend", {
					error_msg: "This account is already verified.",
					userNameTag: "",
				});

			let token = crypto.randomKey(32);
			let tokenSql = "INSERT INTO tokens SET ?";
			let tokenPost = { userId: userRows[0].id, token: token };

			conn.query(tokenSql, tokenPost, (err) => {
				if (err) throw err;
				var mailOptions = {
					from: '"Admin" <no-reply@matcha.com>',
					to: userRows[0].email,
					subject: "Account Verification Token",
					text:
						"Hello,\n\n" +
						"Please verify your account by clicking the link: \nhttp://" +
						req.headers.host +
						"/users/confirmation/" +
						token +
						".\n",
				};
				transporter.sendMail(mailOptions, (err) => {
					if (err) {
						return res.status(500).send({ msg: err.message });
					}
					return res.status(200).render("login", {
						success_msg:
							"A verification email has been sent to " +
							userRows[0].email +
							".",
						userNameTag: "",
					});
				});
			});
		});
	}
};

exports.user_forgotPwd = (req, res) => {
	const email = req.body.email;
	const errors = [];

	if (!email) errors.push({ msg: "Please fill in all fields" });

	if (errors.length > 0)
		res.status(400).render("forgotPwd", { errors, userNameTag: "" });
	else {
		let userSql = "SELECT id, email FROM users WHERE email=?";
		let userPost = [email];

		conn.query(userSql, userPost, (err, userRows) => {
			if (err) {
				return res.status(500).send({ msg: err.message });
			}
			if (userRows.length == 0)
				return res.status(400).render("forgotPwd", {
					error_msg: "We were unable to find a user with that email.",
					userNameTag: "",
				});

			let token = crypto.randomKey(32);
			let tokenSql = "INSERT INTO tokens SET ?";
			let tokenPost = { userId: userRows[0].id, token: token };
			conn.query(tokenSql, tokenPost, (err) => {
				if (err) {
					return res.status(500).send({ msg: err.message });
				}

				var mailOptions = {
					from: '"Admin" <no-reply@matcha.com>',
					to: userRows[0].email,
					subject: "Forgotten Password",
					text:
						"Hello,\n\n" +
						"Please click the link bellow to reset your password: \nhttp://" +
						req.headers.host +
						"/users/changePwd/" +
						token +
						".\n",
				};
				transporter.sendMail(mailOptions, (err) => {
					if (err) {
						return res.status(500).send({ msg: err.message });
					}
					return res.status(200).render("login", {
						success_msg:
							"A password reset email has been sent to " +
							userRows[0].email +
							".",
						userNameTag: "",
					});
				});
			});
		});
	}
};

exports.user_changePwd = (req, res) => {
	const { email, password, pwd_repeat } = req.body;
	const errors = [];

	let lowercase = new RegExp("^(?=.*[a-z])");
	let uppercase = new RegExp("^(?=.*[A-Z])");
	let numeric = new RegExp("^(?=.*[0-9])");
	let spcharacter = new RegExp("^(?=.*[!@#$%^&*])");

	if (!email || !password || !pwd_repeat) {
		errors.push({ msg: "Please fill in all fields" });
	}

	if (password.length < 8) {
		errors.push({ msg: "Password should be at least 8 characters" });
	}

	if (!lowercase.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 lowercase character",
		});
	}

	if (!uppercase.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 uppercase character",
		});
	}

	if (!numeric.test(password)) {
		errors.push({ msg: "Password should contain at least 1 numeric value" });
	}

	if (!spcharacter.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 special character",
		});
	}

	// Check passwords match
	if (password != pwd_repeat) {
		errors.push({ msg: "Passwords do not match" });
	}

	if (errors.length > 0) {
		return res.status(400).render("changePwd", {
			errors,
			token: req.params.userToken,
			userNameTag: "",
		});
	} else {
		let tokenSql = "SELECT * FROM tokens WHERE token=?";
		let tokenPost = [req.params.userToken];

		conn.query(tokenSql, tokenPost, (err, tokenRows) => {
			if (err) {
				return res.status(500).send({ msg: err.message });
			}

			if (tokenRows.length == 0) {
				return res.status(404).render("changePwd", {
					error: "We could not find the token. Your token might have expired",
					token: req.params.userToken,
					userNameTag: "",
				});
			}

			let userSql = "SELECT email, password FROM users WHERE id=?";
			let userPost = [tokenRows[0].userId];

			conn.query(userSql, userPost, (err, userRows) => {
				if (err) {
					return res.status(500).send({ msg: err.message });
				}
				if (userRows.length == 0)
					return res.status(404).render("changePwd", {
						error: "We were unable to find a user for this token.",
						token: req.params.userToken,
						userNameTag: "",
					});
				if (userRows[0].email != email) {
					return res.status(400).render("changePwd", {
						error_msg: "Incorrect email",
						token: req.params.userToken,
						userNameTag: "",
					});
				}

				bcrypt.genSalt(10, (err, salt) => {
					bcrypt.hash(userRows[0].password, salt, (err, hash) => {
						if (err) {
							return res.status(500).send({ msg: err.message });
						}

						// user.password = hash;
						userSql = "UPDATE users SET password=?";
						userPost = [hash];

						conn.query(userSql, userPost, (err) => {
							if (err) {
								return res.status(500).send({ msg: err.message });
							}
							return res.status(200).render("login", {
								success_msg:
									"Your password has been updated and you can now login.",
								userNameTag: "",
							});
						});
					});
				});
			});
		});
	}
};

exports.user_updatePwd = (req, res) => {
	const { id, password, pwd_repeat } = req.body;
	const errors = [];

	let lowercase = new RegExp("^(?=.*[a-z])");
	let uppercase = new RegExp("^(?=.*[A-Z])");
	let numeric = new RegExp("^(?=.*[0-9])");
	let spcharacter = new RegExp("^(?=.*[!@#$%^&*])");

	if (!password || !pwd_repeat) {
		errors.push({ msg: "Please fill in all fields" });
	}

	if (password.length < 8) {
		errors.push({ msg: "Password should be at least 8 characters" });
	}

	if (!lowercase.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 lowercase character",
		});
	}

	if (!uppercase.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 uppercase character",
		});
	}

	if (!numeric.test(password)) {
		errors.push({ msg: "Password should contain at least 1 numeric value" });
	}

	if (!spcharacter.test(password)) {
		errors.push({
			msg: "Password should contain at least 1 special character",
		});
	}

	// Check passwords match
	if (password != pwd_repeat) {
		errors.push({ msg: "Passwords do not match" });
	}

	if (errors.length > 0) {
		return res
			.status(400)
			.render("updatePass", { errors, id: req.user._id, userNameTag: "" });
	} else {
		let userSql = "SELECT * FROM users WHERE id=?";
		let userPost = [id];

		conn.query(userSql, userPost, (err, userRows) => {
			if (err) {
				return res.status(500).send({ msg: err.message });
			}

			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(password, salt, (err, hash) => {
					if (err) {
						return res.status(500).send({ msg: err.message });
					}

					userSql = "UPDATE users SET password=?";
					userPost = [hash];

					conn.query(userSql, userPost, (err) => {
						if (err) {
							return res.status(500).send({ msg: err.message });
						}
						return res.status(200).render("editProfile", {
							success_msg: "Your password has been updated.",
							name: req.user.username,
							firstname: req.user.firstname,
							lastname: req.user.lastname,
							email: req.user.email,
							gender: req.user.gender,
							date: req.user.dob,
							agePref: req.user.agePref,
							sexPref: req.user.sexPref,
							bio: req.user.bio,
							interest_1: req.user.interest_1,
							interest_2: req.user.interest_2,
							interest_3: req.user.interest_3,
							interest_4: req.user.interest_4,
							interest_5: req.user.interest_5,
							pp: req.user.image_1,
							userNameTag: req.user.username,
						});
					});
				});
			});
		});
	}
};

exports.user_extendedProfile = (req, res) => {
	let uploads = res.locals.upload;
	uploads(req, res, async function (err) {
		if (err instanceof multer.MulterError) {
			req.flash("error_msg", err.message);
			return res.status(500).redirect("/users/extendedProfile");
		} else if (err) {
			req.flash("error_msg", err.message);
			return res.status(500).redirect("/users/extendedProfile");
		}

		if (req.file) {
			let userSql = "SELECT * FROM users WHERE id=?";
			let userPost = [req.user.id];
			await conn.query(userSql, userPost, (err, userRows) => {
				if (userRows.length == 0) {
					if (err) {
						return res.status(500).send({ msg: err.message });
					}
				} else {
					const newDate = new Date(req.body.birthdate);
					const ageDifMs = Date.now() - newDate.getTime();
					const ageDate = new Date(ageDifMs);
					const age = Math.abs(ageDate.getUTCFullYear() - 1970);

					let userPost = null;
					if (checkInterest(req.body.interests)) {
						userPost = {
							interest_1: req.body.interests[0],
							interest_2: req.body.interests[1],
							interest_3: req.body.interests[2],
							interest_4: req.body.interests[3],
							interest_5: req.body.interests[4],
							gender: req.body.gender,
							dob: req.body.birthdate,
							agePref: req.body.age_preference,
							sexPref: req.body.sex_pref,
							bio: req.body.bio,
							country: req.body.country,
							province: req.body.province,
							city: req.body.city,
							lat: req.body.lat,
							longitude: req.body.long,
							image_1: req.file.filename,
							image_2: "couple15.jpg",
							image_3: "couple16.jpg",
							image_4: "couple17.jpg",
							image_5: "couple18.jpg",
							gender2: req.body.gender2,
							age: age,
							extendedProf: true,
							loggedIn: true
						};
					} else {
						userPost = {
							interest_1: req.body.interests,
							interest_2: null,
							interest_3: null,
							interest_4: null,
							interest_5: null,
							gender: req.body.gender,
							dob: req.body.birthdate,
							agePref: req.body.age_preference,
							sexPref: req.body.sex_pref,
							bio: req.body.bio,
							country: req.body.country,
							province: req.body.province,
							city: req.body.city,
							lat: req.body.lat,
							longitude: req.body.long,
							image_1: req.file.filename,
							image_2: "couple15.jpg",
							image_3: "couple16.jpg",
							image_4: "couple17.jpg",
							image_5: "couple18.jpg",
							gender2: req.body.gender2,
							age: age,
							extendedProf: true,
							loggedIn: true,
							likedby: "",
							blocked: "",
							viewedby: ""
						};
					}
					let userSql = `UPDATE users SET ? WHERE id=${req.user.id}`;

					conn.query(userSql, userPost, (err) => {
						if (err) {
							return res.status(500).send({ msg: err.message });
						}
						return res.status(200).redirect("/dashboard");
					});
				}
			});
		}
	});
};

exports.user_editProfile = (req, res, next) => {
	let uploads = res.locals.upload;
	var val;

	uploads(req, res, function (err) {
		if (err instanceof multer.MulterError) {
			req.flash("error_msg", err);
			return res.status(500).redirect("/users/editProfile");
		} else if (err) {
			req.flash("error_msg", err);
			return res.status(500).redirect("/users/editProfile");
		}

		const newDate = new Date(req.body.birthdate);
		const ageDifMs = Date.now() - newDate.getTime();
		const ageDate = new Date(ageDifMs);
		const age = Math.abs(ageDate.getUTCFullYear() - 1970);

		let userPost = null;
		if (req.file) {
			userPost = [
				{
					username: req.body.username,
					firstname: req.body.firstname,
					lastname: req.body.lastname,
					email: req.body.email,
					gender: req.body.gender,
					dob: req.body.birthdate,
					agePref: req.body.age_preference,
					sexPref: req.body.sex_pref,
					age: age,
					bio: req.body.bio,
					image_1: req.file.filename,
					country: req.body.country,
					province: req.body.province,
					city: req.body.city,
					lat: req.body.lat,
					longitude: req.body.long,
				},
				req.user.id,
			];
		} else if (!req.file) {
			userPost = [
				{
					username: req.body.username,
					firstname: req.body.firstname,
					lastname: req.body.lastname,
					email: req.body.email,
					gender: req.body.gender,
					dob: req.body.birthdate,
					agePref: req.body.age_preference,
					sexPref: req.body.sex_pref,
					age: age,
					bio: req.body.bio,
					country: req.body.country,
					province: req.body.province,
					city: req.body.city,
					lat: req.body.lat,
					longitude: req.body.long,
				},
				req.user.id,
			];
		}
		if (
			req.user.username !== req.body.username ||
			req.user.firstname !== req.body.firstname ||
			req.user.lastname !== req.body.lastname ||
			req.user.username !== req.body.username ||
			req.user.email !== req.body.email ||
			req.user.gender !== req.body.gender ||
			req.user.dob !== req.body.birthdate ||
			req.user.agePref !== req.body.age_preference ||
			req.user.sexPref !== req.body.sex_pref ||
			req.user.bio !== req.body.bio ||
			req.user.interest_1 !== req.body.interests[0] ||
			req.user.interest_2 !== req.body.interests[1] ||
			req.user.interest_3 !== req.body.interests[2] ||
			req.user.interest_4 !== req.body.interests[3] ||
			req.user.interest_5 !== req.body.interests[4] ||
			req.user.country !== req.body.country ||
			req.user.province !== req.body.province ||
			req.user.city !== req.body.city ||
			req.user.lat !== req.body.lat ||
			req.user.longitude !== req.body.long
		) {
			let userSql = "UPDATE users SET ? WHERE id=?";
			conn.query(userSql, userPost, (err) => {
				if (err) {
					req.flash("error_msg", err.message);
					return res.status(500).redirect("/users/editProfile");
				}

				if (checkInterest(req.body.interests)) {
					userPost = [
						{
							interest_1: req.body.interests[0],
							interest_2: req.body.interests[1],
							interest_3: req.body.interests[2],
							interest_4: req.body.interests[3],
							interest_5: req.body.interests[4],
						},
						req.user.id,
					];
				} else {
					userPost = [
						{
							interest_1: req.body.interests,
							interest_2: null,
							interest_3: null,
							interest_4: null,
							interest_5: null,
						},
						req.user.id,
					];
				}

				conn.query(userSql, userPost, (err) => {
					if (err) {
						return res.status(500).send({ msg: err.message });
					}
					req.flash("success_msg", "Successfully updated information.");
					res.redirect("/users/editProfile");
				});
			});
		}
	});
};

function getDateTime() {
	var date = new Date();

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	var min = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	var sec = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	var year = date.getFullYear();

	var month = date.getMonth() + 1;
	month = getMonth(parseInt((month < 10 ? "0" : "") + month));

	var day = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	return month + " " + day + " " + hour + ":" + min;
}

function getMonth(m) {
	switch (m) {
		case 1:
			return "Jan";
		case 2:
			return "Feb";
		case 3:
			return "Mar";
		case 4:
			return "Apr";
		case 5:
			return "May";
		case 6:
			return "Jun";
		case 7:
			return "Jul";
		case 8:
			return "Aug";
		case 9:
			return "Sep";
		case 10:
			return "Oct";
		case 11:
			return "Nov";
		case 12:
			return "Dec";
		default:
			console.log(m);
	}
}

function getMonth(m) {
	switch (m) {
		case 1:
			return "Jan";
		case 2:
			return "Feb";
		case 3:
			return "Mar";
		case 4:
			return "Apr";
		case 5:
			return "May";
		case 6:
			return "Jun";
		case 7:
			return "Jul";
		case 8:
			return "Aug";
		case 9:
			return "Sep";
		case 10:
			return "Oct";
		case 11:
			return "Nov";
		case 12:
			return "Dec";
		default:
			console.log(m);
	}
}

function checkInterest(interests) {
	if (typeof interests !== "undefined") {
		if (Array.isArray(interests)) {
			return true;
		} else {
			return false;
		}
	}
}
