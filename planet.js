const planet = document.getElementById("planet");
const statusText = document.getElementById("status");


let size = 90;
let maxSize = 260;
let growthSpeed = 0.8;


let boost = true;
setTimeout(() => { boost = false; }, 12000);

function growPlanet() {

  if (size < maxSize) {

    if (boost) {
      size += 0.9;   // fast in demo
    } else {
      size += growthSpeed; // slow after
    }

    planet.style.width = size + "px";
    planet.style.height = size + "px";

  } else {
    statusText.innerText = "Buna time is near…";
    startPulse();
    clearInterval(growInterval);
  }
}

const growInterval = setInterval(growPlanet, 120);

function startPulse(){
  let grow = true;

  setInterval(() => {
    const current = parseFloat(planet.style.width) || maxSize;
    const newSize = grow ? (current * 1.01) : (current * 0.99);
    planet.style.width = newSize + "px";
    planet.style.height = newSize + "px";
    grow = !grow;
  }, 1400);
}


const myID   = localStorage.getItem("bunaID");
const myName = localStorage.getItem("bunaName");

function getUsers() {
  return JSON.parse(localStorage.getItem("bunaUsers")) || [];
}

function getBunaTime() {
  return Number(localStorage.getItem("bunaTime"));
}


/* --------------------------
   CHOOSE BREWER
---------------------------*/
function chooseBrewer() {

  if (localStorage.getItem("bunaChosen")) return;

  const users = getUsers();
  if (users.length === 0) return;

  const choice = users[Math.floor(Math.random() * users.length)];
  localStorage.setItem("bunaChosen", JSON.stringify(choice));
}

chooseBrewer();


/* ---------------------------
   RITUAL STATE (NO NEW COLORS)
----------------------------*/
function updateRitualState(){

  const chosen = JSON.parse(localStorage.getItem("bunaChosen"));
  const bunaTime = getBunaTime();
  const now = Date.now();

  if (!chosen || !bunaTime) return;

  const remaining = bunaTime - now;

  // READY STATE — 30s before
  if (remaining < 30000 && remaining > 0){

    document.body.classList.add("prepare");

    // glow only — color untouched
    planet.style.boxShadow = "0 0 40px rgba(255,255,255,0.3)";
    planet.style.filter = "brightness(1.15)";

    if (chosen.id === myID){
      statusText.innerText = "YOU are the Buna Brewer — Prepare";
    } else {
      statusText.innerText = chosen.name + " is preparing the Buna…";
    }
  }

  // BUNA TIME ACTIVE
  if (remaining <= 0){

    document.body.classList.add("active");

    // stronger glow — same planet color
    planet.style.boxShadow = "0 0 70px rgba(255,255,255,0.6)";
    planet.style.filter = "brightness(1.3)";
    planet.style.transform = "scale(1.15)";

    if (chosen.id === myID){
      statusText.innerText = "Begin the ritual, Brewer";
    } else {
      statusText.innerText = "The ritual has begun";
    }
  }
}


/* ---------------------------
   LOOP
----------------------------*/
setInterval(updateRitualState, 1000);
