const mongoose = require('mongoose');

const LikesSchema = new mongoose.Schema({
	_userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
	likedId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
	user_username: { type: String },
	liked_username: { type: String }
});

const Likes = mongoose.model('Likes', LikesSchema);
module.exports = Likes;