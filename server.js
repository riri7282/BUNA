// SERVER SIDE SCRIPT
const express = require("express");
const app = express();
const server = require("http").Server(app);
const port = process.env.PORT || 3333;
const io = require("socket.io")(server);

app.use(express.static("public"));

server.listen(port, () => {
  console.log("server is listening on port " + port);
});

// server logic below:
let brewer = "";
let timerStarted = false;
let enrolledUsers = [];
let bunaTimer; // Stores the timeout ID

// --- Configuration ---
const THRESHOLD = 2; // Number of users required to start the ritual
const BREWER_DELAY_MS = 10000; // 10 seconds delay before announcing brewer (for testing)

io.on("connection", async (socket) => {
  console.log("new user connected: " + socket.id);
  const socketSet = await io.allSockets();
  const allSocketIDs = Array.from(socketSet);
  
  // Send the current user count to the connecting user
  io.emit("userinfo", allSocketIDs.length); // Use io.emit to update all users immediately

  socket.on("start", (e) => {
    // 1. Check if the user is already enrolled
    if (enrolledUsers.includes(socket.id)) {
        return; // Already enrolled, ignore
    }

    // 2. Handle late joiners (if ritual has already started)
    if (timerStarted) {
      console.log(`Late joiner (${socket.id}). Ritual in progress.`);
      socket.emit("ritualInProgress");
      return;
    }
    
    // 3. Enroll the user
    enrolledUsers.push(socket.id);
    console.log("enrolled users: " + enrolledUsers);

    // 4. Check for threshold
    if (enrolledUsers.length === THRESHOLD && timerStarted === false) {
      console.log("Threshold met! Selecting brewer.");
      
      let randomNum = Math.floor(Math.random() * enrolledUsers.length);
      brewer = enrolledUsers[randomNum];
      console.log("The brewer is " + brewer);

      timerStarted = true;
      // Start the timer to notify the brewer
      bunaTimer = setTimeout(brewerAnnounce, BREWER_DELAY_MS);
      
      // Notify all users that the waiting phase is over (Planet is active)
      io.emit("ritualStartWaiting");
    }
  });

  socket.on("bunaReady", (e) => {
    // This is received from the brewer only
    if (socket.id === brewer) {
        console.log("Brewer confirmed buna ready!");
        
        // 1. Announce to everyone *except* the sender (the brewer)
        socket.broadcast.emit("bunaIsReady"); 
        
        // 2. Clear the pending timeout, as the action was manually triggered
        clearTimeout(bunaTimer); 

        // Optional: Reset state for the next round
        // brewer = "";
        // timerStarted = false;
        // enrolledUsers = [];
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('user disconnected: ' + socket.id);
    
    // Remove disconnected user from enrolled list
    enrolledUsers = enrolledUsers.filter(id => id !== socket.id);
    
    // Update user count for everyone
    const currentSockets = await io.allSockets();
    io.emit("userinfo", Array.from(currentSockets).length);
    
    // Add logic here if the brewer disconnects mid-ritual
  });
});

function brewerAnnounce() {
  // This is called by the setTimeout if the brewer hasn't pressed 'READY' yet
  console.log(`Sending brew notification to selected brewer: ${brewer}`);
  
  // io.to(brewer) sends the event only to the specific socket ID
  io.to(brewer).emit("brewTime");
  
  // Announce to everyone *except* the brewer that the ritual has begun
  // This ensures non-brewers transition from the 'planet forming' state to the 'waiting for the brew' state
  enrolledUsers.forEach(id => {
    if (id !== brewer) {
      io.to(id).emit("ritualBegun");
    }
  });
}