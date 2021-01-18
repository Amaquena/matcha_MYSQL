const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	firstname: {type: String, required: true},
	lastname: { type: String, required: true },
	username: { type: String, required: true },
	email: { type: String, required: true, unique: true, lowercase: true },
	password: {	type: String, required: true },
	dob: { type: Date, default: new Date() },
	creationDate: {	type: Date,	default: Date.now },
	verified: {type: Boolean, default: false },
	extendedProf: {type: Boolean, default: false },
	passwordResetToken: {type: String },
	passwordResetExpires: {type: Date },
	bio: { type: String },
	agePref: { type: String },
	gender: { type: String },
	fame: { type: Number, min: 0, max: 5, default: 0},
	likes: {type: Number, default: 0 },
	views: {type: Number, default: 0 },
	age: {type: Number},
	sexPref: { type: String, default: 'bisexual'},
	interests: {
		first: { type: String },
		second: { type: String },
		third: { type: String },
		fourth: { type: String },
		fifth: { type: String }
	},
	profileImages: {
		image1: { type: String },
		image2: { type: String },
		image3: { type: String },
		image4: { type: String },
		image5: { type: String }
	},
	country: String,
	province: String,
	city: String,
	lat: String,
	long: String,
	gender2: String,
	likedby: [{type: String, default: null}],
	blocked: [{type: String, default: null}],
	viewedby: [{type: String, default: null}],
	loggedIn: {type: Boolean, default: false},
	lastSeen: {type: String}
});

const User = mongoose.model('User', UserSchema);
module.exports = User;