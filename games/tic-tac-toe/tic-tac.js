document.addEventListener("DOMContentLoaded", () => {
  // UI
  const currentTurnDiv = document.getElementById("currentTurn");
  const turnLabel = document.getElementById("turnLabel");
  const cells = document.querySelectorAll(".game-board .cell");

  // Controls
  const openSetupBtn = document.getElementById("openSetup");
  const restartBtn = document.getElementById("restart");
  const setupBox = document.querySelector(".setup"); // the visible setup form box
  const startBtn = document.getElementById("startGame");
  const setupForm = document.getElementById("playerForm"); // keep if you have only ONE form

  // Inputs (scope to the setup box to avoid duplicate-ID issues)
  const p1Input = setupBox ? setupBox.querySelector("#player1") : null;
  const p2Input = setupBox ? setupBox.querySelector("#player2") : null;
  const cpuInput = setupBox
    ? setupBox.querySelector("#computerOpponent")
    : null;

  // Players / state
  const player1 = { name: "Player 1", option: "x" };
  const player2 = { name: "Player 2", option: "o" };
  let currentPlayer = player1;
  let vsCPU = false;
  let gameActive = false;

  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const cap = (s) =>
    typeof s === "string" && s
      ? s[0].toUpperCase() + s.slice(1).toLowerCase()
      : "";

  function paintTurnText() {
    const t = gameActive
      ? `${
          currentPlayer.name
        } – your turn (${currentPlayer.option.toUpperCase()})`
      : "Press Start";
    currentTurnDiv.textContent = t;
    turnLabel.textContent = gameActive ? `${currentPlayer.name}` : "—";
  }

  function resetBoard() {
    cells.forEach((c) => {
      c.textContent = "";
      c.classList.remove("selected", "win");
      c.style.pointerEvents = "auto";
    });
    currentPlayer = player1;
    gameActive = true;
    paintTurnText();
  }

  function endGame(msg) {
    currentTurnDiv.textContent = msg;
    turnLabel.textContent = "—";
    gameActive = false;
    cells.forEach((c) => (c.style.pointerEvents = "none"));
  }

  function checkForWin(p) {
    for (const [a, b, c] of wins) {
      const A = cells[a].textContent.trim().toLowerCase();
      const B = cells[b].textContent.trim().toLowerCase();
      const C = cells[c].textContent.trim().toLowerCase();
      if (A === p.option && B === p.option && C === p.option) {
        [cells[a], cells[b], cells[c]].forEach((el) => el.classList.add("win"));
        endGame(`🎉 ${p.name} wins!`);
        return true;
      }
    }
    return false;
  }

  const checkForDraw = () => [...cells].every((c) => c.textContent.trim());

  function getRandomEmptyCell() {
    const empty = [...cells].filter((c) => !c.textContent.trim());
    return empty.length
      ? empty[Math.floor(Math.random() * empty.length)]
      : null;
  }

  // Toggle setup panel
  openSetupBtn.addEventListener("click", () => {
    setupBox.classList.toggle("is-hidden");
  });

  // Centralized start logic (auto-enable CPU if player2 is empty)
  function startFromForm() {
    const p1 = p1Input ? p1Input.value.trim() : "";
    const p2 = p2Input ? p2Input.value.trim() : "";
    const cpu = cpuInput ? cpuInput.checked : false;

    player1.name = cap(p1) || "Player 1";

    const p2Empty = p2 === "";
    vsCPU = p2Empty || cpu;

    if (vsCPU) {
      player2.name = "Computer";
    } else {
      player2.name = cap(p2) || "Player 2";
    }

    setupBox.classList.add("is-hidden");
    resetBoard();
  }

  // Start handlers
  if (setupForm) {
    setupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      startFromForm();
    });
  }
  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    startFromForm();
  });

  // Restart keeps names/mode
  restartBtn.addEventListener("click", resetBoard);

  // Cell clicks
  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      if (!gameActive) return;
      if (cell.textContent.trim()) return; // block filled cells

      // Human move
      cell.textContent = currentPlayer.option.toUpperCase();
      cell.classList.add("selected");

      if (checkForWin(currentPlayer)) return;
      if (checkForDraw()) {
        endGame("Draw!");
        return;
      }

      // Switch turn
      currentPlayer = currentPlayer === player1 ? player2 : player1;
      paintTurnText();

      // CPU move
      if (vsCPU && currentPlayer === player2 && gameActive) {
        setTimeout(() => {
          const rc = getRandomEmptyCell();
          if (!rc) return;
          rc.textContent = currentPlayer.option.toUpperCase();
          rc.classList.add("selected");

          if (checkForWin(currentPlayer)) return;
          if (checkForDraw()) {
            endGame("Draw!");
            return;
          }

          currentPlayer = player1;
          paintTurnText();
        }, 450);
      }
    });
  });

  // Initial UI
  paintTurnText();
});
