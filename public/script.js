const socket = io();

// --- Screen Management Helper ---
// Hides all screens and shows only the one specified by ID
function showScreen(screenId) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach(screen => {
    screen.style.display = "none";
  });
  const overlay = document.getElementById("ritualOverlay");
  overlay.style.display = "none";

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.style.display = "flex";
  }
}

// Show the initial screen when the script loads
document.addEventListener("DOMContentLoaded", () => {
  showScreen("intro");
});


// --- Server Events ---

// 1. User Count Info
socket.on("userinfo", data => {
  document.getElementById("num").textContent = data.toString();
});

// 2. Notification that the ritual is starting (threshold met)
socket.on("ritualStartWaiting", (e) => {
    // Non-brewers should see the planet is active and waiting
    document.getElementById("planetSub").textContent = "The planet is observing";
    document.getElementById("planetFooter").textContent = "A brewer has been selected. Waiting for the ritual to begin...";
});

// 3. Brewer Notification (Only sent to the selected brewer)
socket.on("brewTime", (e) => {
  console.log("I am the brewer. Time to brew!");
  showScreen("brewerScene"); // Show the dedicated brewer scene
});

// 4. Non-Brewer Notification: Ritual has begun (after delay)
socket.on("ritualBegun", (e) => {
    console.log("I am NOT the brewer. The ritual has officially begun.");
    // Update non-brewer screen to reflect active waiting
    document.getElementById("planetSub").textContent = "Waiting for the brewer...";
    document.getElementById("planetFooter").textContent = "The ritual is in progress. Remain present.";
});

// 5. Buna Ready Notification (for non-brewers)
socket.on("bunaIsReady", (e) => {
  console.log("I am NOT the brewer. Buna is ready!");
  showScreen("readyScene"); // Show the final ready scene
});

// 6. Late Joiner Notification
socket.on("ritualInProgress", (e) => {
    console.log("Ritual already in progress.");
    // Show the overlay over the intro screen
    document.getElementById("ritualOverlay").style.display = "flex";
});


// --- Client Actions ---

function enterBuna(){
  let name = document.getElementById("nameInput").value.trim();
  if(!name) name = "Guest";

  socket.emit("start");

  // HIDE THE INTRO PAGE & SHOW THE "PLANETS" PAGE (Waiting state)
  showScreen("planet");
}

function announce(){
  console.log("Sending buna ready message to server");
  
  // Transition the Brewer to the final scene immediately
  showScreen("readyScene");
  
  // Tell the server that the buna is ready (Server will broadcast to others)
  socket.emit("bunaReady");
}