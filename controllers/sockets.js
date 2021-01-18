const User = require('../models/User');
const Like = require('../models/Likes');
const Chat = require('../models/Chats');

module.exports = function (io, connectedUsers) {
  io.on("connection", socket => {
    let user = {};

    socket.on("update", data => {
      var check = 0;
      for (var i in connectedUsers) {
        if (connectedUsers[i].user == data.user) {
          connectedUsers[i].socketId = data.id;
          check = 1;
        }
      }
      if (check == 0) {
        user.user = data.user
        user.socketId = data.id
        connectedUsers.push(user);
      }
    });

    socket.on("send_message", data => {
      let msg = data.message;
      let msgTime = data.time;
      let to = data.to;
      let from = data.from;
      let chatId = data.chatId;

      if (msg != '' && chatId != '') {
        let newChat = new Chat({
          to: to,
          from: from,
          message: msg,
          msgTime: msgTime,
          chatId: chatId
        })
        newChat.save();
        for (var i in connectedUsers) {
          if (connectedUsers[i].user === to) {
            io.to(connectedUsers[i].socketId).emit('recieve_message', { to: to, from: from, msg: msg, msgTime: msgTime, chatId: chatId })
            io.to(connectedUsers[i].socketId).emit('notification', { user: from, msg: "sent you a new message", match: 1 })
          }
          if (connectedUsers[i].user === from) {
            io.to(connectedUsers[i].socketId).emit('recieve_message', { to: to, from: from, msg: msg, msgTime: msgTime, chatId: chatId })
          }
        }
      }
    });

    socket.on('login', (data) => {
      User.findOne({ $or: [{ username: data.email }, { email: data.email }] }, (err, doc) => {
        if (err) throw err;
        if (doc) {
          let verif = 0;
          user.user = doc.username;
          user.socketId = socket.id;
          for (const i in connectedUsers) {
            if (connectedUsers[i].user == doc.username) {
              connectedUsers[i].socketId = user.socketId
              verif = 1;
            }
          };
          if (verif == 0) {
            connectedUsers.push(user);
          }
        }
      }).catch(err => { console.log(err) })
    });

    socket.on('like', (data) => {
      Like.findOne({user_username: data.likedUser, liked_username: data.currUser}, (err, likeDoc) => {
        if (err) throw err;
        Like.findOne({user_username: data.currUser, liked_username: data.likedUser}, (err, isLiked) => {
          if (err) throw err;

          userIsLiked = 0;
          if (isLiked != null){
            userIsLiked = 1;
          }

        User.findOne({username: data.likedUser}, (err, doc) => {
          if (err) throw err;

          if (likeDoc) {
            let isBlocked = 0;

            if (typeof doc.blocked !== "undefined") {
            if (Array.isArray(doc.blocked)) {
            for (let i in doc.blocked) {
              const blockedUser = doc.blocked[i];
              if (blockedUser === data.currUser) {
                isBlocked = 1;
              }
            }
          }
        } else {
          if (doc.blocked === data.currUser) {
            isBlocked = 1;
          }
        }
            if (isBlocked == 0 && userIsLiked == 0)
            {
              for (var i in connectedUsers) {
                if (connectedUsers[i].user === data.likedUser) {
                  io.to(connectedUsers[i].socketId).emit('notification', { user: data.currUser, msg: "You have a new match with", match: 2 })
                }
              }
            }
          } else {
            let isBlocked = 0;

            if (doc) {
            if (typeof doc.blocked !== "undefined") {
            if (Array.isArray(doc.blocked)) {
            for (let i in doc.blocked) {
              const blockedUser = doc.blocked[i];
              if (blockedUser === data.currUser) {
                isBlocked = 1;
              }
            }
          }
        } else {
          if (doc.blocked === data.currUser){
            isBlocked = 1;
          }
        }
        }
            if (isBlocked == 0 && userIsLiked == 0)
            {
              for (var i in connectedUsers) {
                if (connectedUsers[i].user === data.likedUser) {
                  io.to(connectedUsers[i].socketId).emit('notification', { user: data.currUser, msg: "Liked your profile", match: 1 })
                }
              }
            }
          }
        })
      });
      })
    });

    socket.on('block', (data) => {
      for (var i in connectedUsers) {
        if (connectedUsers[i].user === data.likedUser) {
          io.to(connectedUsers[i].socketId).emit('notification', { user: data.currUser, msg: "Blocked / unliked you", match: 1  })
        }
      }
    })

    socket.on('view', (data) => {
      User.findById(data.viewedId).exec().then(userDoc => {
        let isViewed = 0;
        let viewedbyLength = userDoc.viewedby.length;

        for (var i = 0; i < viewedbyLength; i++) {
          if (userDoc.viewedby[i] == data.currUser) {
            isViewed = 1;
          }
        }
        if (isViewed == 0) {
          for (var i in connectedUsers) {
            if (connectedUsers[i].user === data.viewedUser) {
              io.to(connectedUsers[i].socketId).emit('notification', { user: data.currUser, msg: "viewed your profile", match: 1 })
            }
          }
          userDoc.viewedby.push(data.currUser);
          userDoc.save();
        }
      }).catch();
    })
  });
};