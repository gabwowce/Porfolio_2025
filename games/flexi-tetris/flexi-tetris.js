document.addEventListener("DOMContentLoaded", () => {
  // --- FIGŪROS ---
  const tetrominoes = [
    { shape: [[1, 1, 1, 1]], color: "#711415" },
    {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: "#ae311e",
    },
    {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      color: "#f37324",
    },
    { shape: [[1, 1]], color: "#f6a020" },
    { shape: [[1], [1]], color: "#f8cc1b" },
    {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
      ],
      color: "#b5be2f",
    },
    {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
      ],
      color: "#72b043",
    },
    { shape: [[1]], color: "#007f4e" },
    {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 1],
      ],
      color: "#5343b0",
    },
    {
      shape: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ],
      color: "#43b0a7",
    },
  ];

  // --- DOM ---
  const gameGrid = document.getElementById("gameGrid");
  const pieceContainer = document.getElementById("pieceContainer");
  const dragLayer = document.createElement("div");
  dragLayer.id = "dragLayer"; // CSS: position:fixed; inset:0; pointer-events:none; z-index:9999
  document.body.appendChild(dragLayer);

  // --- SCORE ---
  let score = 0;
  const scoreEl =
    document.getElementById("score") || document.querySelector(".score");
  const addScore = (pts) => {
    score += pts;
    if (scoreEl) scoreEl.textContent = score.toLocaleString("lt-LT");
  };

  // --- STATE ---
  const gridWidth = 10,
    gridHeight = 10;
  let board = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0)
  ); // 0=tuščia,1=užimta
  let gameOver = false;
  let isClearing = false;
  let pendingGOCheck = false;

  // --- LENTA (UI) ---
  for (let i = 0; i < gridWidth * gridHeight; i++) {
    const cell = document.createElement("div");
    cell.classList.add("grid-cell");
    cell.dataset.index = i;
    gameGrid.appendChild(cell);
  }

  function paintCell(r, c, color) {
    gameGrid.children[r * gridWidth + c].style.backgroundColor = color || "";
  }

  // --- HELPERS ---
  function trimShape(shape) {
    let top = shape.length,
      left = shape[0].length,
      bottom = -1,
      right = -1;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          if (r < top) top = r;
          if (r > bottom) bottom = r;
          if (c < left) left = c;
          if (c > right) right = c;
        }
      }
    }
    if (bottom === -1) return [[0]];
    const out = [];
    for (let r = top; r <= bottom; r++)
      out.push(shape[r].slice(left, right + 1));
    return out;
  }

  function canPlaceAt(shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const rr = row + r,
            cc = col + c;
          if (rr < 0 || rr >= gridHeight || cc < 0 || cc >= gridWidth)
            return false;
          if (board[rr][cc] === 1) return false;
        }
      }
    }
    return true;
  }

  function canPlaceAnywhere(shapeRaw) {
    const shape = trimShape(shapeRaw);
    const maxR = gridHeight - shape.length;
    const maxC = gridWidth - shape[0].length;
    for (let r = 0; r <= maxR; r++)
      for (let c = 0; c <= maxC; c++) if (canPlaceAt(shape, r, c)) return true;
    return false;
  }

  // --- GENERATE 3 FIGŪRAS ---
  function generateRandomPieces() {
    pieceContainer.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const piece = document.createElement("div");
      piece.classList.add(`piece-${i + 1}`);
      pieceContainer.appendChild(piece);
    }
    const chosen = [];
    while (chosen.length < 3) {
      const r = Math.floor(Math.random() * tetrominoes.length);
      if (!chosen.includes(r)) chosen.push(r);
    }
    chosen.forEach((index, idx) => {
      const pieceEl = pieceContainer.children[idx];
      pieceEl.dataset.index = index;
      pieceEl.innerHTML = "";
      tetrominoes[index].shape.forEach((row) => {
        const rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        row.forEach((cell) => {
          const d = document.createElement("div");
          d.style.cssText =
            "width:45px;height:45px;margin:2px;border-radius:5px;";
          d.style.backgroundColor = cell
            ? tetrominoes[index].color
            : "transparent";
          rowDiv.appendChild(d);
        });
        pieceEl.appendChild(rowDiv);
      });
      dragElement(pieceEl);
    });

    // jei laukėm GO po sugeneravimo – tik dabar tikrinam
    if (pendingGOCheck && !isClearing) {
      setTimeout(() => {
        if (pendingGOCheck && !gameOver) {
          pendingGOCheck = false;
          checkGameOver();
        }
      }, 0);
    }
  }

  // --- DRAG su „GHOST“ ---
  function dragElement(el) {
    if (gameOver) return;
    let offsetX = 0,
      offsetY = 0,
      ghost = null;

    el.onmousedown = (e) => {
      if (gameOver) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      offsetX = e.clientX - r.left;
      offsetY = e.clientY - r.top;
      ghost = el.cloneNode(true);
      ghost.classList.add("drag-ghost");
      dragLayer.appendChild(ghost);
      el.classList.add("drag-hidden");
      moveGhost(e.clientX - offsetX, e.clientY - offsetY);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    function moveGhost(x, y) {
      ghost.style.left = x + "px";
      ghost.style.top = y + "px";
    }

    function onMove(ev) {
      moveGhost(ev.clientX - offsetX, ev.clientY - offsetY);
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const placed = tryPlaceFromRect(
        +el.dataset.index,
        ghost.getBoundingClientRect(),
        el
      );
      ghost.remove();
      ghost = null;
      if (!placed) el.classList.remove("drag-hidden");
    }
  }

  // --- PADĖJIMAS PAGAL GHOST RECT ---
  function tryPlaceFromRect(pieceIndex, rect, sourceEl) {
    if (gameOver) return false;

    const gridBounds = gameGrid.getBoundingClientRect();
    const gridCellW = 50,
      gridCellH = 50,
      tolerance = 20;
    const startCol = Math.floor(
      (rect.left - gridBounds.left + tolerance) / gridCellW
    );
    const startRow = Math.floor(
      (rect.top - gridBounds.top + tolerance) / gridCellH
    );

    const shape = tetrominoes[pieceIndex].shape;
    if (!canPlaceAt(shape, startRow, startCol)) return false;

    // dėliojam + taškai
    let cellsPlaced = 0;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const rr = startRow + r,
            cc = startCol + c;
          board[rr][cc] = 1;
          paintCell(rr, cc, tetrominoes[pieceIndex].color);
          cellsPlaced++;
        }
      }
    }
    addScore(cellsPlaced * 10);

    const { cleared, doneIn } = removeFullRowsAndColumns();

    // pašalinam šaltinį ir suskaičiuojam kiek liko figūrų
    if (sourceEl) sourceEl.remove();
    const remaining = pieceContainer.querySelectorAll(":scope > div").length;

    const runGO = () => {
      if (!gameOver) checkGameOver();
    };

    if (remaining === 0) {
      // naujas trejetas -> GO tik po sugeneravimo
      pendingGOCheck = true;
      const afterClear = () => {
        isClearing = false;
        generateRandomPieces();
        // GO paleidžiam generateRandomPieces pabaigoje
      };
      if (cleared > 0) {
        isClearing = true;
        setTimeout(afterClear, doneIn);
      } else afterClear();
    } else {
      // dar liko figūrų – GO dabar (po valymo, jei buvo)
      const afterClearNow = () => {
        isClearing = false;
        runGO();
      };
      if (cleared > 0) {
        isClearing = true;
        setTimeout(afterClearNow, doneIn);
      } else runGO();
    }

    return true;
  }

  // --- VALYMAS ---
  function removeFullRowsAndColumns() {
    const animationDuration = 300,
      delayBetween = 30;
    const fullRows = [],
      fullCols = [];

    for (let r = 0; r < gridHeight; r++)
      if (board[r].every((v) => v === 1)) fullRows.push(r);
    for (let c = 0; c < gridWidth; c++) {
      let full = true;
      for (let r = 0; r < gridHeight; r++) {
        if (!board[r][c]) {
          full = false;
          break;
        }
      }
      if (full) fullCols.push(c);
    }

    fullRows.forEach((r) => {
      for (let c = 0; c < gridWidth; c++) {
        const idx = r * gridWidth + c;
        setTimeout(
          () => gameGrid.children[idx].classList.add("fade-out"),
          c * delayBetween
        );
      }
      setTimeout(() => {
        for (let c = 0; c < gridWidth; c++) {
          board[r][c] = 0;
          paintCell(r, c, "");
          gameGrid.children[r * gridWidth + c].classList.remove("fade-out");
        }
      }, gridWidth * delayBetween + animationDuration);
    });

    fullCols.forEach((c) => {
      for (let r = 0; r < gridHeight; r++) {
        const idx = r * gridWidth + c;
        setTimeout(
          () => gameGrid.children[idx].classList.add("fade-out"),
          r * delayBetween
        );
      }
      setTimeout(() => {
        for (let r = 0; r < gridHeight; r++) {
          board[r][c] = 0;
          paintCell(r, c, "");
          gameGrid.children[r * gridWidth + c].classList.remove("fade-out");
        }
      }, gridHeight * delayBetween + animationDuration);
    });

    const rowsDone = fullRows.length
      ? gridWidth * delayBetween + animationDuration
      : 0;
    const colsDone = fullCols.length
      ? gridHeight * delayBetween + animationDuration
      : 0;
    return {
      cleared: fullRows.length + fullCols.length,
      doneIn: Math.max(rowsDone, colsDone),
    };
  }

  // --- GAME OVER ---
  function checkGameOver() {
    if (isClearing || gameOver) return;
    const shapes = [...pieceContainer.querySelectorAll(":scope > div")].map(
      (el) => tetrominoes[+el.dataset.index].shape
    );
    if (shapes.length === 0) return; // dar nesugeneruotos
    const anyFits = shapes.some((s) => canPlaceAnywhere(s));
    if (!anyFits) endGame();
  }

  function endGame() {
    gameOver = true;
    const status = document.getElementById("status");
    if (status) {
      status.classList.remove("sr-only");
      status.textContent = "Game over — no more valid moves. Press Restart.";
    } else {
      alert("Game over — no more valid moves.");
    }
  }

  // --- INIT ---
  generateRandomPieces();

  // --- RESTART ---
  const restartBtn = document.getElementById("restart");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      // UI
      [...gameGrid.children].forEach((c) => (c.style.backgroundColor = ""));
      pieceContainer.innerHTML = "";
      const status = document.getElementById("status");
      if (status) {
        status.textContent = "";
        status.classList.add("sr-only");
      }
      // STATE
      board = Array.from({ length: gridHeight }, () =>
        Array(gridWidth).fill(0)
      );
      isClearing = false;
      gameOver = false;
      pendingGOCheck = false;
      score = 0;
      if (scoreEl) scoreEl.textContent = "0";
      generateRandomPieces();
    });
  }
});
