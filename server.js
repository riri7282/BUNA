const express = require("express");
const app = express();
const server = require("http").Server(app);
const port = process.env.PORT || 3333;
const io = require("socket.io")(server);

app.use(express.static("public"));

server.listen(port, () => {
  console.log("server is listening on port " + port);
});

// --- State ---
let brewer = "";
let timerStarted = false;
let enrolledUsers = [];
let bunaTimer;
let lockoutTimer;

// --- Configuration ---
const THRESHOLD = 2;
const BREWER_DELAY_MS = 10000;

io.on("connection", async (socket) => {
  console.log("new user connected: " + socket.id);
  const socketSet = await io.allSockets();
  const allSocketIDs = Array.from(socketSet);

  io.emit("userinfo", allSocketIDs.length);

  socket.on("start", (e) => {
    if (enrolledUsers.includes(socket.id)) return;

    if (timerStarted) {
      console.log(`Late joiner (${socket.id}). Ritual in progress.`);
      socket.emit("ritualInProgress");
      return;
    }

    enrolledUsers.push(socket.id);
    console.log("enrolled users: " + enrolledUsers);

    if (enrolledUsers.length === THRESHOLD && timerStarted === false) {
      console.log("Threshold met! Selecting brewer.");

      let randomNum = Math.floor(Math.random() * enrolledUsers.length);
      brewer = enrolledUsers[randomNum];
      console.log("The brewer is " + brewer);

      timerStarted = true;
      bunaTimer = setTimeout(brewerAnnounce, BREWER_DELAY_MS);

      io.emit("ritualStartWaiting");
    }
  });

  socket.on("bunaReady", (data) => {
    if (socket.id === brewer) {
      console.log("Brewer confirmed buna ready — starting lockout.");
      clearTimeout(bunaTimer);
      startLockout(data.duration);
    }
  });

  socket.on("disconnect", async () => {
    console.log("user disconnected: " + socket.id);

    enrolledUsers = enrolledUsers.filter(id => id !== socket.id);

    const currentSockets = await io.allSockets();
    io.emit("userinfo", Array.from(currentSockets).length);

    if (socket.id === brewer && timerStarted) {
      console.log("Brewer disconnected — reassigning.");

      if (enrolledUsers.length > 0) {
        let randomNum = Math.floor(Math.random() * enrolledUsers.length);
        brewer = enrolledUsers[randomNum];
        console.log("New brewer assigned: " + brewer);
        io.to(brewer).emit("brewTime");
        io.emit("brewerReassigned");
      } else {
        resetRitual();
      }
    }
  });
});

function brewerAnnounce() {
  console.log(`Sending brew notification to selected brewer: ${brewer}`);

  io.to(brewer).emit("brewTime");

  enrolledUsers.forEach(id => {
    if (id !== brewer) {
      io.to(id).emit("ritualBegun");
    }
  });
}

function startLockout(duration) {
  console.log(`Lockout started — duration: ${duration}ms`);

  io.emit("lockoutStarted", { duration: duration });

  lockoutTimer = setTimeout(() => {
    console.log("Lockout ended.");
    io.emit("lockoutEnded");
    resetRitual();
  }, duration);
}

function resetRitual() {
  console.log("Resetting ritual for next round.");
  brewer = "";
  timerStarted = false;
  enrolledUsers = [];
  clearTimeout(bunaTimer);
  clearTimeout(lockoutTimer);
  io.emit("ritualReset");
}
