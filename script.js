// ====== DATA MODEL ======

function createEmptyGame(player1, player2, player1Color, player2Color) {
  const megaBoard = [];
  for (let m = 0; m < 9; m++) {
    const ultimate = [];
    for (let u = 0; u < 9; u++) {
      const small = new Array(9).fill(null);
      ultimate.push({ cells: small, winner: null });
    }
    megaBoard.push({ smallBoards: ultimate, winner: null });
  }

  return {
    id: Date.now(),
    player1,
    player2,
    player1Color,
    player2Color,
    megaBoard,
    currentMegaIndex: 4,
    currentSmallIndex: 4,
    currentPlayer: 'X',
    freeMove: false,
    history: [],
    lastPlayed: new Date().toISOString()
  };
}

// ====== LOCAL STORAGE ======

const STORAGE_KEY = 'mega_tictactoe_saves';

function loadSaves() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return []; }
}

function saveAllGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function updateGame(game) {
  const games = loadSaves();
  const idx = games.findIndex(g => g.id === game.id);
  if (idx !== -1) {
    games[idx] = game;
    saveAllGames(games);
  }
}

// ====== SCREEN ELEMENTS ======

const startScreen = document.getElementById('start-screen');
const btnNewGame = document.getElementById('btn-new-game');
const btnResumeGame = document.getElementById('btn-resume-game');
const btnImportGame = document.getElementById('btn-import-game');
const importFile = document.getElementById('import-file');
const newGamePopup = document.getElementById('new-game-popup');
const player1Input = document.getElementById('player1-name');
const player2Input = document.getElementById('player2-name');
const player1ColorSelect = document.getElementById('player1-color');
const player2ColorSelect = document.getElementById('player2-color');
const btnCreateGame = document.getElementById('btn-create-game');
const btnCancelNew = document.getElementById('btn-cancel-new');
const resumeScreen = document.getElementById('resume-screen');
const saveListDiv = document.getElementById('save-list');
const btnBackToStart = document.getElementById('btn-back-to-start');
const mapScreen = document.getElementById('map-screen');
const megaBoardDiv = document.getElementById('mega-board');
const gameTitle = document.getElementById('game-title');
const btnExitToStart = document.getElementById('btn-exit-to-start');
const historyBack = document.getElementById('btn-history-back');
const historyForward = document.getElementById('btn-history-forward');
const turnArrowBtn = document.getElementById('btn-go-to-current');
const zoomScreen = document.getElementById('zoom-screen');
const zoomTitle = document.getElementById('zoom-title');
const zoomBoardDiv = document.getElementById('zoom-board');
const btnBackToMap = document.getElementById('btn-back-to-map');
const freeMoveBanner = document.getElementById('free-move-banner');
const saveSort = document.getElementById('save-sort');
const saveFilter = document.getElementById('save-filter');
const tutorialScreen = document.getElementById('tutorial-screen');
const btnHowToPlay = document.getElementById('btn-how-to-play');
const btnTutorialBack = document.getElementById('btn-tutorial-back');

// ====== GLOBAL STATE ======

let currentGame = null;
let historyIndex = null;
let viewingHistory = false;

let historyMegaIndex = null;
let historySmallIndex = null;
let selectedFreeMoveBoard = null;

// ====== COLOR SELECTOR ======

function getPlayerColor(player) {
    return player === 'X'
        ? currentGame.player1Color
        : currentGame.player2Color;
}

// ====== SCREEN HELPERS ======

function showStartScreen() {
    tutorialScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    resumeScreen.classList.add('hidden');
    mapScreen.classList.add('hidden');
    zoomScreen.classList.add('hidden');
    newGamePopup.classList.add('hidden');

    let games = loadSaves();
    
    btnResumeGame.disabled = (games.length === 0);
}

function showNewGamePopup() {
    newGamePopup.classList.remove('hidden');
}

function hideNewGamePopup() {
    newGamePopup.classList.add('hidden');
}

function showResumeScreen() {
    startScreen.classList.add('hidden');
    resumeScreen.classList.remove('hidden');
    renderSaveList();
}

function showMapScreen() {
    if (currentGame && !currentGame.player1Color) {
        currentGame.player1Color = "#ff0000";
    }
    if (currentGame && !currentGame.player2Color) {
        currentGame.player2Color = "#0080ff";
    }
    startScreen.classList.add('hidden');
    resumeScreen.classList.add('hidden');
    zoomScreen.classList.add('hidden');
    mapScreen.classList.remove('hidden');
    renderMap();
}

function showZoomScreen() {
    mapScreen.classList.add('hidden');
    zoomScreen.classList.remove('hidden');
    renderZoomBoard();
}

function showTutorialScreen() {
    startScreen.classList.add('hidden');
    resumeScreen.classList.add('hidden');
    mapScreen.classList.add('hidden');
    zoomScreen.classList.add('hidden');
    tutorialScreen.classList.remove('hidden');
}

function updateAvailableColors() {
    const player1Color =
        player1ColorSelect.value;
    Array.from(player2ColorSelect.options).forEach(option => {
        option.disabled =
            option.value === player1Color;
    });
}

player1ColorSelect.onchange =
    updateAvailableColors;

// ====== TIMESTAMP ======

function formatTimeAgo(dateString) {

    const diff =
        Date.now() -
        new Date(dateString).getTime();

    const minutes =
        Math.floor(diff / 60000);

    const hours =
        Math.floor(minutes / 60);

    const days =
        Math.floor(hours / 24);

    if (minutes < 10) {
        return "A Few Moments Ago";
    }

    if (minutes < 60) {
        return `${minutes} minutes ago`;
    }

    if (hours < 24) {
        return `${hours} hours ago`;
    }

    return `${days} days`;
    }

// ====== SAVE LIST ======

function renderSaveList() {
  let games = loadSaves();

    if (saveFilter.value === "finished") {
    games = games.filter(
        game =>
        checkMegaWinner(game.megaBoard)
    );
}

if (saveFilter.value === "unfinished") {
    games = games.filter(
        game =>
        !checkMegaWinner(game.megaBoard)
    );
}

switch (saveSort.value) {

case "oldest":

    games.sort(
        (a,b) =>
        new Date(a.lastPlayed)
        -
        new Date(b.lastPlayed)
    );

    break;

case "player1":

    games.sort(
        (a,b) =>
        a.player1.localeCompare(
            b.player1
        )
    );

    break;

case "player2":

    games.sort(
        (a,b) =>
        a.player2.localeCompare(
            b.player2
        )
    );

    break;

case "moves-high":

    games.sort(
        (a,b) =>
        b.history.length
        -
        a.history.length
    );

    break;

case "moves-low":

    games.sort(
        (a,b) =>
        a.history.length
        -
        b.history.length
    );

    break;

default:

    games.sort(
        (a,b) =>
        new Date(b.lastPlayed)
        -
        new Date(a.lastPlayed)
    );

}
    
  saveListDiv.innerHTML = '';

  if (games.length === 0) {
    saveListDiv.textContent = 'No saved games.';
    return;
  }

    games.forEach(game => {
        if (!game.player1Color) {
            game.player1Color = "#ff0000";
        }

        if (!game.player2Color) {
            game.player2Color = "#0080ff";
        }
    const wrapper = document.createElement('div');
    const thumbnail =   document.createElement('canvas');

thumbnail.width = 54;
thumbnail.height = 54;

const ctx = thumbnail.getContext('2d');

ctx.fillStyle = '#222';
ctx.fillRect(0,0,54,54);
    wrapper.style.border = '1px solid #555';
    wrapper.style.margin = '5px';
    wrapper.style.padding = '5px';

const title = document.createElement('div');

rebuildUltimateWinnersForGame(game);

const gameWinner =
    checkMegaWinner(
        game.megaBoard
    );

if (gameWinner === 'X') {

    title.textContent =
        `${game.player1} Wins!`;

}
else if (gameWinner === 'O') {

    title.textContent =
        `${game.player2} Wins!`;

}
else {

    title.textContent =
        `${game.player1} vs ${game.player2}`;

}
      
    wrapper.appendChild(title);

    const lastPlayed = document.createElement('div');
    const dateText =
    new Date(game.lastPlayed).toLocaleDateString();

lastPlayed.textContent =
    `${dateText} (${formatTimeAgo(game.lastPlayed)})`;
    wrapper.appendChild(lastPlayed);

    const btnPlay = document.createElement('button');
    btnPlay.textContent = 'Play';
    btnPlay.onclick = () => {
      currentGame = game;
      historyIndex =
          currentGame.history.length;
      selectedFreeMoveBoard = null;
      viewingHistory = false;
      historyMegaIndex = null;
      historySmallIndex = null;
      showMapScreen();
};
    wrapper.appendChild(btnPlay);

    const btnRename = document.createElement('button');
    btnRename.textContent = 'Rename';
    btnRename.onclick = () => {
      const p1 = prompt('New name for Player 1:', game.player1) || game.player1;
      const p2 = prompt('New name for Player 2:', game.player2) || game.player2;
      game.player1 = p1;
      game.player2 = p2;
      updateGame(game);
      renderSaveList();
    };
    wrapper.appendChild(btnRename);

const btnExport = document.createElement('button');
btnExport.textContent = 'Export';
btnExport.onclick = () => {
    exportGame(game);
};
wrapper.appendChild(btnExport);

    const btnDelete = document.createElement('button');
    btnDelete.textContent = 'Delete';
    btnDelete.onclick = () => {
      const gamesAll = loadSaves();
      const filtered = gamesAll.filter(g => g.id !== game.id);
      saveAllGames(filtered);
      renderSaveList();
    };
    wrapper.appendChild(btnDelete);

rebuildUltimateWinnersForGame(
    game
);

game.megaBoard.forEach(
    (ultimateBoard, megaIndex) => {

        if (
            !ultimateBoard.winner
        ) {
            return;
        }

        const startRow =
            Math.floor(
                megaIndex / 3
            ) * 18;

        const startCol =
            (megaIndex % 3) * 18;

        ctx.fillStyle =
            ultimateBoard.winner === 'X'
            ? game.player1Color
            : game.player2Color;

        ctx.fillRect(
            startCol,
            startRow,
            18,
            18
        );
    }
);

game.megaBoard.forEach(
    (ultimateBoard, megaIndex) => {

        if (
            ultimateBoard.winner
        ) {
            return;
        }

        ultimateBoard.smallBoards.forEach(
            (smallBoard, smallIndex) => {

                if (
                    !smallBoard.winner
                ) {
                    return;
                }

                const startRow =
                    Math.floor(
                        megaIndex / 3
                    ) * 18 +

                    Math.floor(
                        smallIndex / 3
                    ) * 6;

                const startCol =
                    (megaIndex % 3) * 18 +

                    (smallIndex % 3) * 6;

                ctx.fillStyle =
                    smallBoard.winner === 'X'
                    ? game.player1Color
                    : game.player2Color;

                ctx.fillRect(
                    startCol,
                    startRow,
                    6,
                    6
                );
            }
        );
    }
);
      
game.history.forEach(move => {

    const row =
        Math.floor(move.megaIndex / 3) * 9 +
        Math.floor(move.smallIndex / 3) * 3 +
        Math.floor(move.cellIndex / 3);

    const col =
        (move.megaIndex % 3) * 9 +
        (move.smallIndex % 3) * 3 +
        (move.cellIndex % 3);

    ctx.fillStyle =
        move.player === 'X'
            ? game.player1Color
            : game.player2Color;

    if (!game.megaBoard[move.megaIndex].winner && !game.megaBoard[move.megaIndex].smallBoards[move.smallIndex].winner) {
    ctx.fillRect(
        col * 2,
        row * 2,
        2,
        2
    );
    }
});

wrapper.prepend(thumbnail);
      
    saveListDiv.appendChild(wrapper);
  });
}

// ====== SMALL WINS ======

function getHistoricWinners(historyLimit) {

    const winners = {};
    const boards = {};

    currentGame.history
        .slice(0, historyLimit)
        .forEach(move => {

            const key =
                `${move.megaIndex}-${move.smallIndex}`;

            if (!boards[key]) {
                boards[key] =
                    new Array(9).fill(null);
            }

            boards[key][move.cellIndex] =
                move.player;

            const winner =
                checkWinner(boards[key]);

            if (winner) {
                winners[key] = winner;
            }
        });
    return winners;
}

// ====== Ulitmate Wins ======

function getHistoricUltimateWinners(
    historyLimit
) {

    const smallWinners =
        getHistoricWinners(
            historyLimit
        );

    const ultimateWinners = {};

    for (
        let megaIndex = 0;
        megaIndex < 9;
        megaIndex++
    ) {

        const boardWinners = [];

        for (
            let smallIndex = 0;
            smallIndex < 9;
            smallIndex++
        ) {

            boardWinners.push(
                smallWinners[
                    `${megaIndex}-${smallIndex}`
                ] || null
            );

        }

        const winner =
            checkWinner(
                boardWinners
            );

        if (winner) {

            ultimateWinners[
                megaIndex
            ] = winner;

        }

    }

    return ultimateWinners;

}

// ====== REPLAY BOARD BUILDER ======

function buildBoardFromHistory(moveCount) {

    const megaBoard = [];

    for (let m = 0; m < 9; m++) {

        const ultimate = [];

        for (let s = 0; s < 9; s++) {

            ultimate.push({
                cells: new Array(9).fill(null),
                winner: null
            });

        }

        megaBoard.push({
            smallBoards: ultimate,
            winner: null
        });

    }

    currentGame.history
        .slice(0, moveCount)
        .forEach(move => {

            const smallBoard =
                megaBoard[
                    move.megaIndex
                ].smallBoards[
                    move.smallIndex
                ];

            smallBoard.cells[
                move.cellIndex
            ] = move.player;

            const smallWinner =
                checkWinner(
                    smallBoard.cells
                );

            if (smallWinner) {

                smallBoard.winner =
                    smallWinner;

            }

        });

    megaBoard.forEach(
        ultimateBoard => {

            const winner =
                checkUltimateWinner(
                    ultimateBoard
                );

            ultimateBoard.winner =
                winner;

        }
    );

    return megaBoard;

}

// ====== MAP RENDERING ======

function renderMap() {
  if (!currentGame) return;
  rebuildUltimateWinners();

const boardToRender =

    viewingHistory

    ? buildBoardFromHistory(
        historyIndex
      )

    : currentGame.megaBoard;

    if (
        currentGame.freeMove &&
        !viewingHistory &&
        !checkMegaWinner(currentGame.megaBoard)
    ) {
        freeMoveBanner.classList.remove('hidden');
    } else {
       freeMoveBanner.classList.add('hidden');
    }

  const gameWinner =
    checkMegaWinner(
        currentGame.megaBoard
    );

  const megaWinner =
    gameWinner;

if (gameWinner === 'X') {

    gameTitle.textContent =
        `${currentGame.player1} Wins!`;

}
else if (gameWinner === 'O') {

    gameTitle.textContent =
        `${currentGame.player2} Wins!`;

}
else {

    gameTitle.textContent =
        `${currentGame.player1} vs ${currentGame.player2}`;

}
    
megaBoardDiv.innerHTML = '';

const activeMega =
    viewingHistory
    ? null
    : (
        selectedFreeMoveBoard
        ? selectedFreeMoveBoard.mega
        : currentGame.currentMegaIndex
    );

const activeSmall =
    viewingHistory
    ? null
    : (
        selectedFreeMoveBoard
        ? selectedFreeMoveBoard.small
        : currentGame.currentSmallIndex
    );

const activeStartRow =
    activeMega === null
        ? null
        : Math.floor(activeMega / 3) * 9 +
          Math.floor(activeSmall / 3) * 3;

const activeStartCol = activeMega === null
        ? null
        : (activeMega % 3) * 9 +
          (activeSmall % 3) * 3;
    
const activeColor = getPlayerColor(currentGame.currentPlayer);
    
for (let row = 0; row < 27; row++) {

  for (let col = 0; col < 27; col++) {

    const cell = document.createElement('div');
    cell.className = 'mega-cell';

    // thick line every small board
    cell.style.borderTop = '1px solid #555';
    cell.style.borderLeft = '1px solid #555';

    if (row % 3 === 0) {
      cell.style.borderTop = '2px solid white';
    }

    if (col % 3 === 0) {
      cell.style.borderLeft = '2px solid white';
    }

    if (row % 9 === 0 && row !== 0) {
     cell.style.borderTop = '4px solid white';
    }  

    if (col % 9 === 0 && col !== 0) {
     cell.style.borderLeft = '4px solid white';
    }

const boardMega =
    Math.floor(row / 9) * 3 +
    Math.floor(col / 9);

const boardSmall =
    Math.floor((row % 9) / 3) * 3 +
    Math.floor((col % 9) / 3);

cell.onclick = () => {

    if (
        !currentGame.freeMove ||
        viewingHistory
    ) {
        return;
    }

    const boardWinner =
    currentGame
        .megaBoard[boardMega]
        .smallBoards[boardSmall]
        .winner;
    
    const ultimateWinner =
    currentGame.megaBoard[
        boardMega
    ].winner;

    if (boardWinner || ultimateWinner) {
        return;
    }

selectedFreeMoveBoard = {
    mega: boardMega,
    small: boardSmall
};

currentGame.currentMegaIndex =
    boardMega;

currentGame.currentSmallIndex =
    boardSmall;

renderMap();
};

const megaData =
    boardToRender[boardMega];

const boardData =
    boardToRender[boardMega]
        .smallBoards[boardSmall];

if (megaData.winner === 'X') {
    cell.style.background = currentGame.player1Color;
}
else if (megaData.winner === 'O') {
    cell.style.background = currentGame.player2Color;
}
else if (boardData.winner === 'X') {
    cell.style.background = currentGame.player1Color;
}
else if (boardData.winner === 'O') {
    cell.style.background = currentGame.player2Color;
}
      
currentGame.history
  .slice(0, historyIndex)
  .forEach(move => {
      
  const boardRow =
      Math.floor(move.megaIndex / 3) * 9 +
      Math.floor(move.smallIndex / 3) * 3 +
      Math.floor(move.cellIndex / 3);

  const boardCol =
      (move.megaIndex % 3) * 9 +
      (move.smallIndex % 3) * 3 +
      (move.cellIndex % 3);

    if (
        boardRow === row &&
        boardCol === col
    )
{
    cell.style.background =
    getPlayerColor(move.player);
}
});

const inActiveBoard =
    !megaWinner &&
    activeMega !== null &&
    row >= activeStartRow &&
    row < activeStartRow + 3 &&
    col >= activeStartCol &&
    col < activeStartCol + 3;

if (inActiveBoard) {

    if (row === activeStartRow) {
        cell.style.borderTop = `4px solid ${activeColor}`;
    }

    if (row === activeStartRow + 2) {
        cell.style.borderBottom = `4px solid ${activeColor}`;
    }

    if (col === activeStartCol) {
        cell.style.borderLeft = `4px solid ${activeColor}`;
    }

    if (col === activeStartCol + 2) {
        cell.style.borderRight = `4px solid ${activeColor}`;
    }
}
      
    megaBoardDiv.appendChild(cell);
  }
}

if (megaWinner) {

    turnArrowBtn.classList.add(
        "hidden"
    );

}
else {

    turnArrowBtn.classList.remove(
        "hidden"
    );

}
    
    turnArrowBtn.style.background =
        getPlayerColor(currentGame.currentPlayer);
    turnArrowBtn.style.color = "white";
    
  historyBack.disabled = historyIndex <= 0;
  historyForward.disabled = historyIndex >= currentGame.history.length;

    if (
    viewingHistory ||
    (
        currentGame.freeMove &&
        selectedFreeMoveBoard === null
    )
) {

    turnArrowBtn.style.opacity = "0.3";
    turnArrowBtn.disabled = true;

} else {

    turnArrowBtn.style.opacity = "1";
    turnArrowBtn.disabled = false;

}
}

// ====== ZOOM BOARD ======

function renderZoomBoard() {
  if (!currentGame) return;

  const m = currentGame.currentMegaIndex;
  const s = currentGame.currentSmallIndex;

  zoomTitle.textContent = `Ultimate ${m + 1}, Small ${s + 1}`;

  zoomBoardDiv.innerHTML = '';

  const smallBoard = currentGame.megaBoard[m].smallBoards[s];

  smallBoard.cells.forEach((cell, cIndex) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'zoom-cell';

    if (cell === 'X') {
        cellDiv.style.background = currentGame.player1Color;
    }
    else if (cell === 'O') {
    cellDiv.style.background = currentGame.player2Color;
    }

    cellDiv.onclick = () => {
      handleCellClick(m, s, cIndex);
    };

    zoomBoardDiv.appendChild(cellDiv);
  });
}

// ====== SMALL GAME WIN ======

    function checkWinner(cells) {

    const wins = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],
        [1,4,7],
        [2,5,8],
        [0,4,8],
        [2,4,6]
    ];

    for (const line of wins) {

        const [a,b,c] = line;

        if (
            cells[a] &&
            cells[a] === cells[b] &&
            cells[b] === cells[c]
        ) {
            return cells[a];
        }
    }

    return null;
}

function checkUltimateWinner(ultimateBoard) {

    const winners =
        ultimateBoard.smallBoards.map(
            board => board.winner
        );

    return checkWinner(winners);
}

function checkMegaWinner(megaBoard) {

    const winners =
        megaBoard.map(
            ultimate => ultimate.winner
        );

    return checkWinner(winners);

}

function rebuildUltimateWinners() {

    currentGame.megaBoard.forEach(
        ultimateBoard => {

            const winner =
                checkUltimateWinner(
                    ultimateBoard
                );

            ultimateBoard.winner =
                winner;
        }
    );

}

function rebuildUltimateWinnersForGame(game) {

    game.megaBoard.forEach(
        ultimateBoard => {

            const winner =
                checkUltimateWinner(
                    ultimateBoard
                );

            ultimateBoard.winner =
                winner;
        }
    );

}

// ====== GAME LOGIC ======

function handleCellClick(mIndex, sIndex, cIndex) {
  const smallBoard = currentGame.megaBoard[mIndex].smallBoards[sIndex];

  if (smallBoard.cells[cIndex] !== null) return;

  const player = currentGame.currentPlayer;
  smallBoard.cells[cIndex] = player;

currentGame.history.push({
    megaIndex: mIndex,
    smallIndex: sIndex,
    cellIndex: cIndex,
    player
  });

  historyIndex = currentGame.history.length;

    const winner =
    checkWinner(smallBoard.cells);

if (winner) {

    smallBoard.winner = winner;

    const ultimateBoard =
        currentGame.megaBoard[mIndex];

    const ultimateWinner =
        checkUltimateWinner(
            ultimateBoard
        );

    if (ultimateWinner) {
        
    ultimateBoard.winner =
        ultimateWinner;

    const megaWinner =
        checkMegaWinner(
            currentGame.megaBoard
        );

    if (megaWinner) {
        currentGame.freeMove = false;
        selectedFreeMoveBoard = null;
        alert(
            megaWinner === 'X'
            ? `${currentGame.player1} wins!`
            : `${currentGame.player2} wins!`
        );
        updateGame(currentGame);
        showMapScreen();
        return;
}
}}

  currentGame.lastPlayed = new Date().toISOString();

  const targetBoard =
    currentGame
        .megaBoard[sIndex]
        .smallBoards[cIndex];
  const targetUltimate =
    currentGame.megaBoard[sIndex];

if (targetBoard.winner || targetUltimate.winner) {

    currentGame.freeMove = true;

} else {

    currentGame.freeMove = false;
    selectedFreeMoveBoard = null;
    currentGame.currentMegaIndex = sIndex;
    currentGame.currentSmallIndex = cIndex;
}

  currentGame.currentPlayer = player === 'X' ? 'O' : 'X';

    if (!currentGame.freeMove) {
    selectedFreeMoveBoard = null;
}

  updateGame(currentGame);

  showMapScreen();
}

// ====== HISTORY ======

historyBack.onclick = () => {
  if (historyIndex <= 0) return;
  historyIndex--;
  viewingHistory = true;
  freeMoveBanner.classList.add('hidden');
  const move = currentGame.history[historyIndex];
  historyMegaIndex = move.megaIndex;
  historySmallIndex = move.smallIndex;
  renderMap();
};

historyForward.onclick = () => {
  if (historyIndex >= currentGame.history.length) return;
  historyIndex++;
  if (historyIndex < currentGame.history.length) {
    const move = currentGame.history[historyIndex];
    historyMegaIndex = move.megaIndex;
    historySmallIndex = move.smallIndex;
  }
  if (historyIndex === currentGame.history.length) {

    viewingHistory = false;

    historyMegaIndex = null;
    historySmallIndex = null;
}
  renderMap();
};

// ====== EXPORT ======

function exportGame(game) {
    const json =
        JSON.stringify(
            game,
            null,
            2
        );
    const blob =
        new Blob(
            [json],
            {
                type: "application/json"
            }
        );
    const url =URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =        `MegaTTT_${game.player1}_vs_${game.player2}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// ====== BUTTONS ======

btnNewGame.onclick = () => {
  showNewGamePopup();
};

btnCancelNew.onclick = () => {
  hideNewGamePopup();
};

btnCreateGame.onclick = () => {
    const p1 = player1Input.value.trim() || 'Player 1';
    const p2 = player2Input.value.trim() || 'Player 2';
    const player1Color = player1ColorSelect.value;
    const player2Color = player2ColorSelect.value;
    const game = createEmptyGame(p1, p2, player1Color, player2Color);
    const games = loadSaves();
    games.push(game);
    saveAllGames(games);

    currentGame = game;
        selectedFreeMoveBoard = null;

    viewingHistory = false;

    historyMegaIndex = null;
    historySmallIndex = null;
    historyIndex = 0;

    hideNewGamePopup();
    showMapScreen();
};

btnResumeGame.onclick = () => {
  showResumeScreen();
};

btnBackToStart.onclick = () => {
  showStartScreen();
};

btnExitToStart.onclick = () => {
  currentGame = null;
  historyIndex = null;
  viewingHistory = false;
  historyMegaIndex = null;
  historySmallIndex = null;
  showStartScreen();
};

turnArrowBtn.onclick = () => {

    if (viewingHistory) {

        historyIndex = currentGame.history.length;

        viewingHistory = false;

        renderMap();

        return;
    }

    if (selectedFreeMoveBoard) {

        currentGame.freeMove = false;
    }

    showZoomScreen();
};

btnBackToMap.onclick = () => {
  showMapScreen();
};

saveSort.onchange = () => {
    renderSaveList();
};

saveFilter.onchange = () => {
    renderSaveList();
};

btnHowToPlay.onclick = () => {
    showTutorialScreen();
};

btnTutorialBack.onclick = () => {
    showStartScreen();
};

// ====== IMPORT LOGIC ======

btnImportGame.onclick = () => {
    importFile.click();
};
importFile.onchange = e => {
    const file =
        e.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const importedGame = JSON.parse(reader.result);
            const games =loadSaves();
            importedGame.id =
                Date.now();
            games.push(importedGame);
            saveAllGames(games);
            alert("Game imported successfully!");
            showResumeScreen();
        }
        catch {
            alert("Invalid save file.");
        }
    };
    reader.readAsText(file);
};

// ====== INITIAL LOAD ======

updateAvailableColors();
showStartScreen();
