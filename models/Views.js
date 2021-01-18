const mongoose = require('mongoose');

const ViewsSchema = new mongoose.Schema({
	_userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
	viewedId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
	userViewUsername: { type: String }
});

const Views = mongoose.model('Views', ViewsSchema);
module.exports = Views;