const localStrategy = require("passport-local").Strategy;
const conn = require("./keys").MYSQL_CONNECTION;
const bcrypt = require("bcryptjs");

module.exports = function (passport, res) {
	passport.use(
		new localStrategy({ usernameField: "email" }, (email, password, done) => {
			// Match user
			let userSql =
				"SELECT * FROM users WHERE `username`=? OR `email`=?";
			conn.query(userSql, [email, email], (err, rows) => {
				if (err) throw err;
				if (rows.length == 0) {
					return done(null, false, { message: "That email is not registered" });
				}

				if (!rows[0].verified) {
					return done(null, false, {
						message: "Please verify email to log in.",
					});
				}

				bcrypt.compare(password, rows[0].password, (err, isMatch) => {
					if (err) {
						return res.status(401).send({ msg: err.message });
					}
					if (isMatch) {
						return done(null, rows[0]);
					} else {
						return done(null, false, { message: "Password incorrect" });
					}
				});
			});
		})
	);

	// Saves the user id as a session variable(req.session.passport.user)
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser((id, done) => {
		conn.query("select * from users where id = "+id, (err,rows) => {	
			done(err, rows[0]);
		});
	});
};
