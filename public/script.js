const socket = io(); // use this to initialize the connection to the server

socket.on("brewTime", (e) => {
  console.log("i am the brewer");
  // HIDE PLANETS PAGE
  // SHOW BREWER INSTRUCTIONS PAGE
  const bunaReadyTimer = setTimeout(announce,5000); // instead of attaching this to a timer, maybe bind it to "coffee is brewed!" button.
});

function announce(){
  console.log("sending buna ready message to server");
  // HIDE BREWER INSTRUCTIONS PAGE
  // SHOW "OTHER USERS HAVE BEEN NOTIFIED" PAGE
  socket.emit("bunaReady");
}

socket.on("bunaIsReady", (e) => {
  // HIDE PLANETS PAGE
  // SHOW BUNA READY PAGE
  console.log("I am NOT the brewer, but I am receiving an announcement that buna is ready");
});


socket.on("userinfo", data => {
  document.getElementById("num").textContent = data.toString();
});


function enterBuna(){
  let name = document.getElementById("nameInput").value.trim();
  if(!name) name = "Guest";

  socket.emit("start");

  // HIDE THE INTRO PAGE
  const introDiv = document.getElementById("intro");
  introDiv.style.display = "none";
  // SHOW THE "PLANETS" PAGE
  const planetDiv = document.getElementById("planet");
  planet.style.display = "block";
}
