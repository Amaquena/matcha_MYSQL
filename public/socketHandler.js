$(function () {
  const socket = io.connect();

  var element = function (id) {
    return document.getElementById(id);
  };

  // Get Elements
  // get current logged in username
  var user = element("userNameTag");
  // Chat Page
  var chatBox = element("chatBox");
  var send = element("send");
  var to = element("to");
  var from = element("from");
  var chatId = element("chatId");
  var msgBox = element("msgBox");
  // Login Page
  var login = element("login");
  var inputEmail = element("inputEmail");
  // Profiles Page
  var like_btn = element("like_btn");
  var block_btn = element("block_btn");
  var liked_username = element("liked_username");
  var user_id = element("user_id");
  var curr_userUsername = element("curr_userUsername");
  var curr_userId = element("curr_userId");

  // Notification Tab
  var notify_message = element("notify-message");
  var noti_btn = element("noti_btn");
  var thanks = element("thanks");
  var thanks2 = element("thanks2");
  let notifTag;

  socket.on("connect", () => update());
  function update() {
    socket.emit("update", { user: user.value, id: socket.id });
  }

  if (chatBox) {
    chatBox.addEventListener("keydown", (event) => {
      if (event.which === 13 && event.shiftKey == false) {
        socket.emit("send_message", {
          to: to.value,
          from: from.value,
          chatId: chatId.value,
          message: chatBox.value,
          time: getDateTime(),
        });
        chatBox.value = "";
        event.preventDefault();
      }
    });
  }

  if (send) {
    send.addEventListener("click", (event) => {
      socket.emit("send_message", {
        to: to.value,
        from: from.value,
        chatId: chatId.value,
        message: chatBox.value,
        time: getDateTime(),
      });
      chatBox.value = "";
      event.preventDefault();
    });
  }

  if (login) {
    login.addEventListener("click", (event) => {
      socket.emit("login", { email: inputEmail.value });
    });
  }

  if (like_btn) {
    like_btn.addEventListener("click", () => {
      socket.emit("like", {
        likedUser: liked_username.value,
        currUser: curr_userUsername.value,
      });
    });
  }

  if (block_btn) {
    block_btn.addEventListener("click", () => {
      socket.emit("block", {
        likedUser: liked_username.value,
        currUser: curr_userUsername.value,
      });
    });
  }

  if (liked_username && curr_userUsername) {
    if (liked_username.value && curr_userUsername.value) {
      socket.emit("view", {
        viewedUser: liked_username.value,
        currUser: curr_userUsername.value,
        viewedId: user_id.value,
        currId: curr_userId.value,
      });
    }
  }

  if (noti_btn) {
    socket.on("notification", (data) => {
      noti_btn.classList.replace("btn-danger", "btn-success");
      notifTag = document.createElement("p");
      if (data.match == 1) {
        notifTag.textContent = data.user + " " + data.msg + "!";
      } else if (data.match == 2) {
        notifTag.textContent = data.msg + " " + data.user + "!";
      }
      notify_message.appendChild(notifTag);
    });
  }

  if (thanks && thanks2) {
    thanks.addEventListener("click", () => {
      noti_btn.classList.add("btn-danger");
      while (notify_message.firstChild) {
        notify_message.removeChild(notify_message.lastChild);
      }
    });
    thanks2.addEventListener("click", () => {
      noti_btn.classList.add("btn-danger");
      while (notify_message.firstChild) {
        notify_message.removeChild(notify_message.lastChild);
      }
    });
  }

  if (from) {
    if (from.value) {
      socket.on("recieve_message", (data) => {
        var div1 = document.createElement("div");
        var div2 = document.createElement("div");
        var div3 = document.createElement("div");
        var p1 = document.createElement("p");
        var p2 = document.createElement("p");

        if (from.value === data.from) {
          div1.setAttribute("class", "media w-50 ml-auto mb-3");
          div2.setAttribute("class", "media-body bg-white");
          div3.setAttribute("class", "bg-danger rounded py-2 px-3 mb-2");
          p1.setAttribute("class", "text-small mb-0 text-white");
        } else if (from.value === data.to) {
          div1.setAttribute("class", "media w-50 mb-3");
          div2.setAttribute("class", "media-body ml-3");
          div3.setAttribute("class", "bg-light rounded py-2 px-3 mb-2");
          p1.setAttribute("class", "text-small mb-0 text-muted");
        }
        p2.setAttribute("class", "small text-muted");
        p1.textContent = data.msg;
        p2.textContent = "from " + data.from + ": " + data.msgTime;
        
        msgBox
        .appendChild(div1)
        .appendChild(div2)
        .appendChild(div3)
        .appendChild(p1);
        div2.appendChild(p2);
        
        scrollToBottom();
      });
    }
  }
});

function scrollToBottom() {
  let recieved = document.querySelector("#msgBox").lastElementChild;
  recieved.scrollIntoView();
}

function getDateTime() {
  var date = new Date();

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

  return hour + ":" + min + " | " + month + " " + day;
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
