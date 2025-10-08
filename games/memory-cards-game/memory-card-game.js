const cardsArray = [
  { name: "Apple", img: "../memory-cards-game/img/apple.png" },
  { name: "Papaya", img: "../memory-cards-game/img/papaya.png" },
  { name: "Soursop", img: "../memory-cards-game/img/soursop.png" },
  { name: "Coconut", img: "../memory-cards-game/img/coconut.png" },
  { name: "Kumquat", img: "../memory-cards-game/img/kumquat.png" },
  {
    name: "Bactris-gasipaes",
    img: "../memory-cards-game/img/bactris-gasipaes.png",
  },
  { name: "Banana", img: "../memory-cards-game/img/banana.png" },
  { name: "Dragon-fruit", img: "../memory-cards-game/img/dragon-fruit.png" },

  { name: "Apple", img: "../memory-cards-game/img/apple.png" },
  { name: "Papaya", img: "../memory-cards-game/img/papaya.png" },
  { name: "Soursop", img: "../memory-cards-game/img/soursop.png" },
  { name: "Coconut", img: "../memory-cards-game/img/coconut.png" },
  { name: "Kumquat", img: "../memory-cards-game/img/kumquat.png" },
  {
    name: "Bactris-gasipaes",
    img: "../memory-cards-game/img/bactris-gasipaes.png",
  },
  { name: "Banana", img: "../memory-cards-game/img/banana.png" },
  { name: "Dragon-fruit", img: "../memory-cards-game/img/dragon-fruit.png" },
];

const gameBoard = document.querySelector(".game-board");
const timeEl = document.getElementById("time");
const movesEl = document.getElementById("moves");
const bestEl = document.getElementById("best");
const restartBtn = document.getElementById("restart");
const statusEl = document.getElementById("status");

let firstCard, secondCard;
let hasFlippedCard = false;
let lockBoard = false;
let moves = 0;
let matchedPairs = 0;
const totalPairs = cardsArray.length / 2;

let startTime = null;
let timerInterval = null;

init();

function init() {
  // best time iš localStorage
  const best = localStorage.getItem("mem_best_time_ms");
  bestEl.textContent = best ? formatTime(+best) : "—";

  createBoard();
  attachHandlers();
}

function attachHandlers() {
  restartBtn.addEventListener("click", restart);
  // klaviatūra: Enter/Space apverčia
  gameBoard.addEventListener("keydown", (e) => {
    if (
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "Spacebar" ||
      e.key === "Space"
    ) {
      const el = document.activeElement;
      const card = el && el.closest(".g-card");
      if (card) {
        e.preventDefault(); // kad nestrigtų dvigubi click'ai
        flipCard.call(card);
      }
    }
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createBoard() {
  gameBoard.innerHTML = "";
  shuffle(cardsArray);
  cardsArray.forEach((card, idx) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "g-card";
    el.dataset.name = card.name;
    el.setAttribute("role", "gridcell");
    el.setAttribute("aria-label", "Paslėpta kortelė");
    el.setAttribute("tabindex", "0");

    const inner = document.createElement("div");
    inner.className = "g-card-inner";

    const front = document.createElement("div");
    front.className = "g-card-front";

    const back = document.createElement("div");
    back.className = "g-card-back";

    const img = document.createElement("img");
    img.src = card.img;
    img.alt = card.name;
    back.append(img);

    inner.append(front, back);
    el.append(inner);
    el.addEventListener("click", flipCard);

    gameBoard.appendChild(el);
  });

  // reset HUD
  moves = 0;
  matchedPairs = 0;
  movesEl.textContent = moves.toString();
  stopTimer(true); // clear only
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;
  this.classList.add("flipped");
  this.setAttribute("aria-label", `${this.dataset.name}, atversta`);

  // start timer ties pirmu ėjimu
  if (!startTime) startTimer();

  if (!hasFlippedCard) {
    hasFlippedCard = true;
    firstCard = this;
    return;
  }
  secondCard = this;
  moves++;
  movesEl.textContent = moves.toString();
  checkForMatch();
}

function checkForMatch() {
  const isMatch = firstCard.dataset.name === secondCard.dataset.name;
  isMatch ? keepOpen() : unflip();
}

function keepOpen() {
  firstCard.removeEventListener("click", flipCard);
  secondCard.removeEventListener("click", flipCard);
  matchedPairs++;

  // announce(
  //   `Rasta pora: ${firstCard.dataset.name}. Porų: ${matchedPairs}/${totalPairs}.`
  // );

  resetTurn();

  if (matchedPairs === totalPairs) {
    const elapsed = stopTimer();
    saveBest(elapsed);
    announce(`Pergalė! Laikas: ${formatTime(elapsed)}, ėjimai: ${moves}.`);
    // galima pridėti animaciją ar konfeti – palikau tau :)
  }
}

function unflip() {
  lockBoard = true;
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    firstCard.setAttribute("aria-label", "Paslėpta kortelė");
    secondCard.classList.remove("flipped");
    secondCard.setAttribute("aria-label", "Paslėpta kortelė");
    resetTurn();
  }, 650);
}

function resetTurn() {
  [hasFlippedCard, lockBoard] = [false, false];
  [firstCard, secondCard] = [null, null];
}

function restart() {
  stopTimer(true);
  startTime = null;
  timeEl.textContent = "00:00";
  createBoard();
  announce("Žaidimas pradėtas iš naujo.");
}

function startTimer() {
  startTime = performance.now();
  timerInterval = setInterval(() => {
    const ms = performance.now() - startTime;
    timeEl.textContent = formatTime(ms);
  }, 100);
}

function stopTimer(onlyClear = false) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (!onlyClear && startTime) {
    const ms = performance.now() - startTime;
    startTime = null;
    return ms;
  }
  startTime = null;
  return 0;
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function saveBest(ms) {
  const key = "mem_best_time_ms";
  const best = localStorage.getItem(key);
  if (!best || ms < +best) {
    localStorage.setItem(key, String(ms));
    bestEl.textContent = formatTime(ms);
  }
}

function announce(msg) {
  statusEl.textContent = msg;
}
