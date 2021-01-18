const mongoose = require('mongoose');

const ChatsSchema = new mongoose.Schema({
    to: { type: String },
    from: {type: String },
    msgTime: { type: String },
    message: { type: String },
    chatId: { type: String},
    time: {type: Date, default: Date.now}
});

const Chats = mongoose.model('Chats', ChatsSchema);
module.exports = Chats;