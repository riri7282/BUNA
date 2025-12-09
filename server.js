// SERVER SIDE SCRIPT
const express = require("express"); // use the express dependency and store it in "express"
const app = express(); // create a new express app called "app"
const server = require("http").Server(app); // create an http server using my app
const port = process.env.PORT || 3333;
const io = require("socket.io")(server); // create socket.io instance and bind to my server

app.use(express.static("public")); // points our clients to the "public" folder when they connect

server.listen(port, () => {
  console.log("server is listening on port " + port);
});

// server logic below:
// server RECEIVES a "message" event from a client containing "data"
// "data" is broadcast to every other connected user

let brewer = "";
let timerStarted = false;
let enrolledUsers = [];

io.on("connection", async (socket) => {
  // create a function bound to the connection event
  //console.log("new user connected: " + socket.id); // print a message when a new user connects
  const socketSet = await io.allSockets();
  const allSocketIDs = Array.from(socketSet);
  //console.log("all sockets connected: " + allSocketIDs);
  socket.emit("userinfo", allSocketIDs.length);
  socket.on("start", (e) => {
    enrolledUsers.push(socket.id);
    console.log("enrolled users: " + enrolledUsers);
    if (enrolledUsers.length >= 4) {
      console.log("threshold met!");
      let randomNum = Math.floor(Math.random() * enrolledUsers.length);
      brewer = enrolledUsers[randomNum];
      console.log("the brewer is " + brewer);
      if (timerStarted == false) {
        timerStarted = true;
        const bunaTimer = setTimeout(brewerAnnounce, 10000, brewer);
      }
    }
  });
  socket.on("bunaReady", (e) => {
    // bind a new function to the "message" event on the socket
    console.log("buna ready! announcing to all other users"); // print the received message to the debug console
    socket.broadcast.emit("bunaIsReady"); // send whatever was received using "message" event
  });
});

function brewerAnnounce(theBrewer) {
  console.log("sending brewer announcement to " + theBrewer);
  io.to(theBrewer).emit("brewTime");
}

// selecting a brewer - bind to connection event, after a certain amount of connections have been made to the server - DONE
// start a timer once brewer has been selected
// brewer notification - time to brew (single client: "brewer") - happens on timeout
// buna notification for everyone else (everyone but brewer)
