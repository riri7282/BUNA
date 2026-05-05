const socket = io();

// --- Screen Management ---
function showScreen(screenId) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach(screen => { screen.style.display = "none"; });
  document.getElementById("ritualOverlay").style.display = "none";

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) targetScreen.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {
  showScreen("intro");
});

// --- Countdown Timer ---
let countdownInterval;

function startCountdown(duration) {
  let remaining = Math.floor(duration / 1000);

  countdownInterval = setInterval(() => {
    remaining--;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    document.getElementById("timer").textContent = display;

    if (remaining <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
}

function clearCountdown() {
  clearInterval(countdownInterval);
  document.getElementById("timer").textContent = "Complete";
}

// --- Sound Ping ---
function triggerSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  [0, 0.3, 0.6].forEach(delay => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + delay);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + delay + 0.4);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.5);

    oscillator.start(audioCtx.currentTime + delay);
    oscillator.stop(audioCtx.currentTime + delay + 0.5);
  });
}

// --- Server Events ---

socket.on("userinfo", data => {
  const numEl = document.getElementById("num");
  if (numEl) numEl.textContent = data.toString();
});

socket.on("ritualStartWaiting", () => {
  document.getElementById("planetSub").textContent = "The planet is observing";
  document.getElementById("planetFooter").textContent = "Waiting for the ritual to begin...";
});

socket.on("brewTime", () => {
  console.log("I am the brewer.");
  showScreen("brewerScene");
});

socket.on("ritualBegun", () => {
  document.getElementById("planetSub").textContent = "Waiting for the brewer...";
  document.getElementById("planetFooter").textContent = "A brewer has been selected. Remain present.";
});

socket.on("bunaIsReady", () => {
  console.log("Buna is ready — lockout starting.");
  triggerSound();
  showScreen("readyScene");
});

socket.on("lockoutStarted", (data) => {
  console.log("Lockout started.");
  triggerSound();
  showScreen("lockoutScene");
  startCountdown(data.duration);
});

socket.on("lockoutEnded", () => {
  console.log("Lockout ended.");
  clearCountdown();
  showScreen("readyScene");
});

socket.on("ritualReset", () => {
  console.log("Ritual reset.");
  clearCountdown();
  showScreen("intro");
});

socket.on("brewerReassigned", () => {
  console.log("Brewer was reassigned.");
  document.getElementById("planetSub").textContent = "A new brewer has been chosen...";
});

socket.on("ritualInProgress", () => {
  console.log("Ritual already in progress.");
  document.getElementById("ritualOverlay").style.display = "flex";
});

// --- Client Actions ---

function enterBuna() {
  let name = document.getElementById("nameInput").value.trim();
  if (!name) name = "Guest";
  socket.emit("start");
  showScreen("planet");
}

function announce() {
  console.log("Brewer sending ready signal.");

  const select = document.getElementById("durationSelect");
  const chosenDuration = parseInt(select.value);

  showScreen("lockoutScene");
  startCountdown(chosenDuration);
  socket.emit("bunaReady", { duration: chosenDuration });
}