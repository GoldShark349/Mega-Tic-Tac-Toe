// ====== DATA MODEL ======

function createEmptyGame(
    player1, 
    player2, 
    player1Color, 
    player2Color
) {
  const megaBoard = [];
  for (let m = 0; m < 9; m++) {
    const ultimate = [];
    for (let u = 0; u < 9; u++) {
      const small = new Array(9).fill(null);
      ultimate.push({ cells: small, winner: null});
    }
    megaBoard.push({ smallBoards: ultimate, winner: null });
  }

  return {
    id: Date.now(),
    gameType: currentGameType,
    player1,
    player2,
    player1Color,
    player2Color,
    megaBoard,
    currentPath: [4,4],
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
    try {
        return JSON
            .parse(raw)
            .map(normalizeSave);
    }
    catch { return []; }
}

function normalizeSave(game) {
    if (!game.gameType) {
        game.gameType = "mega";
    }
    if (!game.currentPath) {
        game.currentPath =
            game.gameType === "ultimate"
            ? [4]
            : [4,4];
    }
    return game;
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
const megaHomeScreen = document.getElementById('mega-home-screen');
const btnClassicGame = document.getElementById('btn-classic-game');
const btnUltimateGame = document.getElementById('btn-ultimate-game');
const btnMegaGame = document.getElementById('btn-mega-game');
const btnSuperGame = document.getElementById('btn-super-game');
const btnBackToSelection = document.getElementById('btn-exit-game');
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
const gameHomeTitle = document.getElementById("game-home-title");

// ====== GLOBAL STATE ======

let currentGame = null;
let historyIndex = null;
let viewingHistory = false;

let historyMegaIndex = null;
let historySmallIndex = null;
let freeMoveSelection = null;
let currentGameType = "mega";

const GAME_CONFIGS = {
    classic: {
        title: "Tic Tac Toe"
    },
    ultimate: {
        title: "Ultimate Tic Tac Toe"
    },
    mega: {
        title: "Mega Tic Tac Toe"
    },
    super: {
        title: "Super Tic Tac Toe"
    }
};

function getGameHandler() {
    return GAME_HANDLERS[
        currentGameType
    ];
}

const GAME_HANDLERS = {
    mega: {
        renderMap,
        renderZoom: renderZoomBoard,
        handleMove: handleCellClick,
        buildHistory:
            buildBoardFromHistory
    },
    ultimate: {
        renderMap: renderUltimateMap,
        renderZoom: renderUltimateZoom,
        handleMove: handleUltimateMove,
        buildHistory:
            buildUltimateBoardFromHistory
    }
};

// ====== COLOR SELECTOR ======

function getPlayerColor(player) {
    return player === 'X'
        ? currentGame.player1Color
        : currentGame.player2Color;
}

function getCurrentPlayerColor() {
    return getPlayerColor(
        currentGame.currentPlayer
    );
}

function applyWinnerFill(
    element,
    winner,
    player1Color,
    player2Color
) {
    if (winner === 'X') {
        element.style.backgroundColor =
            player1Color;
    }
    else if (winner === 'O') {
        element.style.backgroundColor =
            player2Color;
    }
}

function applyHighlight(
    element,
    active
) {
    element.classList.remove(
        "highlighted-board"
    );
    if (!active) {
        return;
    }
    element.classList.add(
        "highlighted-board"
    );
    element.style.color =
        getCurrentPlayerColor();
}

// ====== UNIVERSAL HELPER FUNCTIONS ======

function showStartScreen() {
    tutorialScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    resumeScreen.classList.add('hidden');
    mapScreen.classList.add('hidden');
    zoomScreen.classList.add('hidden');
    newGamePopup.classList.add('hidden');
    megaHomeScreen.classList.add('hidden');
    let games = loadSaves();
    btnResumeGame.disabled = (games.length === 0);
}

function showGameHomeScreen() {
    startScreen.classList.add('hidden');
    megaHomeScreen.classList.remove('hidden');
    resumeScreen.classList.add('hidden');
    mapScreen.classList.add('hidden');
    zoomScreen.classList.add('hidden');
    tutorialScreen.classList.add('hidden');
    gameHomeTitle.textContent =
        GAME_CONFIGS[currentGameType].title;
    let games = loadSaves();
    btnResumeGame.disabled =
        games.filter(
            g =>
            g.gameType ===
            currentGameType
        ).length === 0;
}

function showNewGamePopup() {
    newGamePopup.classList.remove('hidden');
}

function hideNewGamePopup() {
    newGamePopup.classList.add('hidden');
}

function showResumeScreen() {
    startScreen.classList.add('hidden');
    megaHomeScreen.classList.add('hidden');
    resumeScreen.classList.remove('hidden');
    renderSaveList();
}

function renderCurrentGame() {
    getGameHandler()
        .renderMap();
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
    megaHomeScreen.classList.add('hidden');
    renderCurrentGame();
}

function showZoomScreen() {
    mapScreen.classList.add('hidden');
    zoomScreen.classList.remove('hidden');
    megaHomeScreen.classList.add('hidden');
    renderCurrentZoom();
}

function showTutorialScreen() {
    startScreen.classList.add('hidden');
    megaHomeScreen.classList.add('hidden');
    resumeScreen.classList.add('hidden');
    mapScreen.classList.add('hidden');
    zoomScreen.classList.add('hidden');
    tutorialScreen.classList.remove('hidden');
}

function updateAvailableColors() {
    const player1Color = player1ColorSelect.value;
    const player2Color = player2ColorSelect.value;
    Array.from(player1ColorSelect.options).forEach(option => {
        option.disabled = option.value === player2Color;
    });
    Array.from(player2ColorSelect.options).forEach(option => {
        option.disabled = option.value === player1Color;
    });
}

function switchPlayer() {
    currentGame.currentPlayer =
        currentGame.currentPlayer === 'X'
        ? 'O'
        : 'X';
}

function showWinner(
    winner
) {
    alert(
        winner === 'X'
        ? `${currentGame.player1} wins!`
        : `${currentGame.player2} wins!`
    );
}

function resetHistoryView() {
    viewingHistory = false;
    historyMegaIndex = null;
    historySmallIndex = null;
}

function updateHistoryButtons() {
    historyBack.disabled =
        historyIndex <= 0;
    historyForward.disabled =
        historyIndex >=
        currentGame.history.length;
}

function leaveHistoryMode() {
    historyIndex =
        currentGame.history.length;
    resetHistoryView();
    updateHistoryButtons();
}

function clearSelections() {
    freeMoveSelection = null;
}

function startFreeMoveSelection(
    ...levels
) {
    freeMoveSelection = {};
    levels.forEach(
        (level, index) => {
            freeMoveSelection[
                `level${index + 1}`
            ] = level;
        }
    );
}

function setCurrentBoard(
    ...levels
) {
    currentGame.currentPath =
        levels;
}

function isBoardPlayable(
    board
) {
    return (
        board &&
        !board.winner
    );
}

function isPlayableDestination(
    board
) {
    return isBoardPlayable(
        board
    );
}

function getCurrentPathLevel(
    level
) {
    return currentGame.currentPath[
        level
    ];
}

function isHighlightedBoard(
    boardIndex
) {
    const active =
        getHighlightedLevels();
    return (
        active.level1 ===
        boardIndex
    );
}

function isHighlightedSmallBoard(
    ultimateIndex,
    smallIndex
) {
    if (viewingHistory) {
        return false;
    }
    const active =
        getHighlightedLevels();
    return (
        active.level1 ===
            ultimateIndex
        &&
        active.level2 ===
            smallIndex
    );
}

function createMiniBoardElement(
    board,
    player1Color,
    player2Color
) {
    const container =
        document.createElement('div');
    container.className =
        'small-board-thumb';
    if (!board.winner) {
        board.cells.forEach(
            value => {
                const cell =
                    document.createElement(
                        'div'
                    );
                cell.className =
                    'mini-cell';
                if (value === 'X') {
                    cell.style.background =
                        player1Color;
                }
                else if (value === 'O') {
                    cell.style.background =
                        player2Color;
                }
                container.appendChild(
                    cell
                );
            }
        );
    }
    applyWinnerFill(
        container,
        board.winner,
        player1Color,
        player2Color
    );
    return container;
}

function createUltimateCellElement(
    value
) {
    const cell =
        document.createElement("div");
    cell.className =
        "mini-cell";
    if (value === "X") {
        cell.style.backgroundColor =
            currentGame.player1Color;
    }
    else if (value === "O") {
        cell.style.backgroundColor =
            currentGame.player2Color;
    }
    return cell;
}

function createUltimateBoardElement(
    ultimateBoard,
    player1Color,
    player2Color,
    ultimateIndex
) {
    const container =
        document.createElement('div');
    container.className =
        'ultimate-board';
    if (!ultimateBoard.winner) {
        ultimateBoard.smallBoards.forEach(
        (board, smallIndex) => {
            const mini =
                createMiniBoardElement(
                    board,
                    player1Color,
                    player2Color
                );
        if (
            isHighlightedSmallBoard(
                ultimateIndex,
                smallIndex
            )
        ) {
            applyHighlight(
                mini,
                isHighlightedSmallBoard(
                    ultimateIndex,
                    smallIndex
                )
            );
        }
        mini.onclick = (e) => {
            e.stopPropagation();
            if (
                !currentGame.freeMove
            ) {
                return;
            }
            const targetBoard =
                ultimateBoard.smallBoards[
                    smallIndex
                ];
            if (
                !isPlayableDestination(
                    targetBoard
                )
            ) {
                return;
            }
            startFreeMoveSelection(
                ultimateIndex,
                smallIndex
            );
            setCurrentBoard(
                ultimateIndex,
                smallIndex
            );
            renderMap();
        };
        container.appendChild(
            mini
        );
    });
}
    applyWinnerFill(
        container,
        ultimateBoard.winner,
        player1Color,
        player2Color
    );
    return container;
}

function getCurrentBoardSet() {
    if (
        currentGameType ===
        "ultimate"
    ) {
        return viewingHistory
            ? buildGameStateFromHistory(
                historyIndex
              )
            : currentGame.ultimateBoard;
    }
    return viewingHistory
        ? buildGameStateFromHistory(
            historyIndex
          )
        : currentGame.megaBoard;
}

function buildGameStateFromHistory(
    moveCount
) {
    return getGameHandler()
        .buildHistory(
            moveCount
        );
}

function shouldDisableContinue() {
    return (
        viewingHistory ||
        !hasValidSelection()
    );
}

function updateFreeMoveBanner() {
    freeMoveBanner.classList.toggle(
        'hidden',
        !(
            currentGame.freeMove &&
            !viewingHistory
        )
    );
}

function updateContinueButton() {
    turnArrowBtn.disabled =
        shouldDisableContinue();
    turnArrowBtn.style.opacity =
        shouldDisableContinue()
            ? "0.3"
            : "1";
    turnArrowBtn.style.background =
        getCurrentPlayerColor();
    turnArrowBtn.style.color =
        "white";
}

function updateGameTitle(
    winner = null
) {
    if (winner === 'X') {
        gameTitle.textContent =
            `${currentGame.player1} Won!`;
        return;
    }
    if (winner === 'O') {
        gameTitle.textContent =
            `${currentGame.player2} Won!`;
        return;
    }
    gameTitle.textContent =
        `${currentGame.player1} vs ${currentGame.player2}`;
}

function hasValidSelection() {
    if (!currentGame.freeMove) {
        return true;
    }
    if (!freeMoveSelection) {
        return false;
    }
    return true;
}

function getHighlightedLevels() {
    if (
        currentGame.freeMove &&
        freeMoveSelection
    ) {
        return freeMoveSelection;
    }
    return {
        level1:
            currentGame.currentPath[0],
        level2:
            currentGame.currentPath[1]
    };
}

player1ColorSelect.onchange =
    updateAvailableColors;

player2ColorSelect.onchange =
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

    games = games.filter(game => {
        const type =
            game.gameType || "mega";
        return type === currentGameType;
    });

if (saveFilter.value === "finished") {
    games = games.filter(game => {
        if (game.gameType === "ultimate") {
            return checkUltimateGameWinner(
                game.ultimateBoard
            );
        }
        return checkMegaWinner(
            game.megaBoard
        );
    });
}
    
if (saveFilter.value === "unfinished") {
    games = games.filter(game => {
        if (game.gameType === "ultimate") {
            return !checkUltimateGameWinner(
                game.ultimateBoard
            );
        }
        return !checkMegaWinner(
            game.megaBoard
        );
    });
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

let gameWinner = null;

if (game.gameType === "mega") {
    rebuildUltimateWinnersForGame(
        game
    );
    gameWinner =
        checkMegaWinner(
            game.megaBoard
        );
}
else if (
    game.gameType === "ultimate"
) {
    gameWinner =
        checkUltimateGameWinner(
            game.ultimateBoard
        );
}

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
        currentGameType = game.gameType;
        currentGame = game;
        if (!currentGame.currentPath) {
            currentGame.currentPath =
                currentGame.gameType ===
                "ultimate"
                ? [
                    currentGame.currentBoard ?? 4
                ]
                : [
                    currentGame.currentMegaIndex ?? 4,
                    currentGame.currentSmallIndex ?? 4
                ];
        }
        historyIndex = currentGame.history.length;
        clearSelections();
        resetHistoryView();
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

if (game.gameType === "mega") {

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

}

if (
    game.gameType === "ultimate"
) {

    game.ultimateBoard.forEach(
        (board, boardIndex) => {

            if (board.winner) {

                const row =
                    Math.floor(
                        boardIndex / 3
                    );

                const col =
                    boardIndex % 3;

                ctx.fillStyle =
                    board.winner === "X"
                        ? game.player1Color
                        : game.player2Color;

                ctx.fillRect(
                    col * 18,
                    row * 18,
                    18,
                    18
                );
            }

            board.cells.forEach(
                (cell, cellIndex) => {

                    if (!cell) return;

                    const row =
                        Math.floor(
                            boardIndex / 3
                        ) * 6 +
                        Math.floor(
                            cellIndex / 3
                        ) * 2;

                    const col =
                        (boardIndex % 3) * 6 +
                        (cellIndex % 3) * 2;

                    ctx.fillStyle =
                        cell === "X"
                            ? game.player1Color
                            : game.player2Color;

                    ctx.fillRect(
                        col * 3,
                        row * 3,
                        3,
                        3
                    );
                }
            );
        }
    );
}
    
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
        getHistoricWinners(historyLimit);
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
            checkWinner(boardWinners);
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
                checkWinner(smallBoard.cells);
            if (smallWinner) {
                smallBoard.winner = smallWinner;
            }
        });
    megaBoard.forEach(
        ultimateBoard => {
            const winner =
                checkUltimateWinner(ultimateBoard);
            ultimateBoard.winner = winner;
        }
    );
    return megaBoard;
}

function buildUltimateBoardFromHistory(
    moveCount
) {
    const boards = [];

    for (
        let i = 0;
        i < 9;
        i++
    ) {
        boards.push({
            cells: new Array(9).fill(null),
            winner: null
        });
    }

    currentGame.history
        .slice(0, moveCount)
        .forEach(move => {

            const board =
                boards[
                    move.boardIndex
                ];

            board.cells[
                move.cellIndex
            ] = move.player;

            const winner =
                checkWinner(
                    board.cells
                );

            if (winner) {
                board.winner = winner;
            }
        });

    return boards;
}

// ====== MEGA MAP RENDERING ======

function renderMegaNestedMap() {
    megaBoardDiv.innerHTML = '';
    const container =
        document.createElement('div');
    container.className =
        'mega-board-grid';
    const boardSet =
        getCurrentBoardSet();
    boardSet.forEach(
        (
            ultimateBoard,
            index
        ) => {
            const board =
                createUltimateBoardElement(
                    ultimateBoard,
                    currentGame.player1Color,
                    currentGame.player2Color,
                    index
                );
            board.classList.add(
                'mega-ultimate-board'
            );
            board.onclick = () => {
                if (viewingHistory) {
                    return;
                }
                if (currentGame.freeMove) {
                    const targetBoard =
                        currentGame.megaBoard[index];
                    if (targetBoard.winner) {
                        return;
                    }
                    startFreeMoveSelection(
                        index
                    );
                    renderMap();
                    return;
                }
                if (
                    index !==
                    getCurrentPathLevel(0)
                ) {
                    return;
                }

                showZoomScreen();

            };
            container.appendChild(
                board
            );
        }
    );
    megaBoardDiv.appendChild(
        container
    );
}

// ====== MAP RENDERING ======

function renderMap() {
    if (!currentGame) return;
    megaBoardDiv.style.gridTemplateColumns =
        "";

    megaBoardDiv.style.gridTemplateRows =
        "";

    updateFreeMoveBanner();

    updateGameTitle(
        checkMegaWinner(
            currentGame.megaBoard
        )
    );
    
    renderMegaNestedMap();
    
    updateHistoryButtons();
    
    updateContinueButton();
    
    return;
}

// ====== ULTIMATE MAP RENDERING ======

function renderUltimateMap() {
    updateFreeMoveBanner();
    updateGameTitle(
        checkUltimateGameWinner(
            currentGame.ultimateBoard
        )
    );

    megaBoardDiv.innerHTML = '';
    const boardSet =
        viewingHistory
            ? buildGameStateFromHistory(
                historyIndex
            )
            : currentGame.ultimateBoard;
    megaBoardDiv.style.gridTemplateColumns =
        "repeat(3, 1fr)";
    megaBoardDiv.style.gridTemplateRows =
        "repeat(3, 1fr)";
for (
    let boardIndex = 0;
    boardIndex < 9;
    boardIndex++
) {
    const cell =
        document.createElement('div');
    cell.className =
        'mega-cell';
    cell.className =
    "mega-cell ultimate-map-board";
    const board =
        boardSet[
            boardIndex
        ];
    if (!board.winner) {
        board.cells.forEach(
            value => {
                const mini =
                    createUltimateCellElement(
                        value
                    );
                cell.appendChild(
                    mini
                );
            }
        );
    }
    applyHighlight(
        cell,
        (
            !viewingHistory &&
            isHighlightedBoard(
                boardIndex
            )
        )
        ||
        (
            currentGame.freeMove &&
            freeMoveSelection &&
            freeMoveSelection.level1 ===
                boardIndex
        )
    );
    applyWinnerFill(
        cell,
        board.winner,
        currentGame.player1Color,
        currentGame.player2Color
    );
    cell.onclick = () => {
        if (
            currentGame.freeMove
        ) {
            if (
                !isPlayableDestination(
                    board
                )
            ) {
                return;
            }
            startFreeMoveSelection(
                boardIndex
            );
            setCurrentBoard(
                boardIndex
            );
            renderUltimateMap();
            return;
        }
        if (
            !isHighlightedBoard(
                boardIndex
            )
        ) {
            return;
        }
        showZoomScreen();
    };
    megaBoardDiv.appendChild(
        cell
    );
}
    updateContinueButton();
}

// ====== ZOOM BOARD ======

function renderZoomBoard() {
  if (!currentGame) return;

    const [
        m,
        s
    ] = currentGame.currentPath;

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

function renderUltimateZoom() {
    zoomBoardDiv.innerHTML = '';
    const board =
        currentGame.ultimateBoard[
            currentGame.currentPath[0]
        ];
    board.cells.forEach(
        (cell, index) => {
            const div =
                document.createElement('div');
            div.className =
                'zoom-cell';
            if (cell === 'X') {
                div.style.background =
                    currentGame.player1Color;
            }
            else if (cell === 'O') {
                div.style.background =
                    currentGame.player2Color;
            }
            div.onclick = () => {
                handleCurrentMove(
                    currentGame.currentPath[0],
                    index
                );
            };

            zoomBoardDiv.appendChild(
                div
            );
        }
    );
}

function renderCurrentZoom() {
    getGameHandler()
        .renderZoom();
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

function getWinnerFromBoards(
    boards
) {
    return checkWinner(
        boards.map(
            board => board.winner
        )
    );
}

function checkUltimateWinner(ultimateBoard) {
    const winners =
        ultimateBoard.smallBoards.map(
            board => board.winner
        );
    return checkWinner(winners);
}

function checkMegaWinner(
    megaBoard
) {
    return getWinnerFromBoards(
        megaBoard
    );
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

function handleCurrentMove(
    ...args
) {
    getGameHandler()
        .handleMove(
            ...args
        );
}

function handleCellClick(mIndex, sIndex, cIndex) {
  const smallBoard = currentGame.megaBoard[mIndex].smallBoards[sIndex];

  if (smallBoard.cells[cIndex] !== null) return;

    const player =
        currentGame.currentPlayer;
    smallBoard.cells[cIndex] =
        player;
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
        clearSelections();
        showWinner(
            megaWinner
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
    clearSelections();

    setCurrentBoard(
        sIndex,
        cIndex
    );
}

    switchPlayer();

    if (!currentGame.freeMove) {
    clearSelections();
}

  updateGame(currentGame);

  showMapScreen();
}

function handleUltimateMove(
    boardIndex,
    cellIndex
) {
    const board =
        currentGame.ultimateBoard[
            boardIndex
        ];
    if (
        board.cells[cellIndex]
        !== null
    ) {
        return;
    }
    const player =
        currentGame.currentPlayer;
    board.cells[cellIndex] =
        player;
    currentGame.history.push({
        boardIndex,
        cellIndex,
        player
    });
        historyIndex =
            currentGame.history.length;
    const boardWinner =
        checkWinner(
            board.cells
        );
    if (boardWinner) {
        board.winner =
            boardWinner;
    }
    const gameWinner =
        checkUltimateGameWinner(
            currentGame
                .ultimateBoard
        );
    if (gameWinner) {
        currentGame.freeMove = false;
        clearSelections();
        showWinner(
            gameWinner
        );
        updateGame(
            currentGame
        );
        showMapScreen();
        return;
    }
    switchPlayer();
    const targetBoard =
        currentGame.ultimateBoard[
            cellIndex
        ];

    if (
        !isBoardPlayable(
            targetBoard
        )
    ) {
        currentGame.freeMove = true;
    }
    else {
        currentGame.freeMove = false;
        clearSelections();
        
        setCurrentBoard(
            cellIndex
        );
    }

    currentGame.lastPlayed =
        new Date().toISOString();
    if (!currentGame.freeMove) {
        clearSelections();
    }
    updateGame(
        currentGame
    );
    showMapScreen();

}
    
// ====== ULTIMATE GAME DATA ======

function createUltimateGame(
    player1,
    player2,
    player1Color,
    player2Color
) {
    const ultimateBoard = [];
    for (
        let i = 0;
        i < 9;
        i++
    ) {
        ultimateBoard.push({
            cells:
                new Array(9).fill(null),
            winner: null
        });
    }
    return {
        id: Date.now(),
        gameType: "ultimate",
        player1,
        player2,
        player1Color,
        player2Color,
        ultimateBoard,
        currentPath: [4],
        currentPlayer: 'X',
        freeMove: false,
        history: [],
        lastPlayed:
            new Date()
                .toISOString()
    };
}

function checkUltimateSmallWinner(
    board
) {
    return checkWinner(
        board.cells
    );
}

function checkUltimateGameWinner(
    ultimateBoard
) {
    return getWinnerFromBoards(
        ultimateBoard
    );
}

// ====== HISTORY ======

historyBack.onclick = () => {
    if (historyIndex <= 0) return;
    historyIndex--;
    viewingHistory = true;
    freeMoveBanner.classList.add('hidden');
    const move = currentGame.history[historyIndex];
    if (
        currentGameType === "mega"
    ) {
        historyMegaIndex =
            move.megaIndex;
        historySmallIndex =
            move.smallIndex;
    }
    updateHistoryButtons();
    renderCurrentGame();
};

historyForward.onclick = () => {
  if (historyIndex >= currentGame.history.length) return;
  historyIndex++;
    if (historyIndex < currentGame.history.length) {
        const move = currentGame.history[historyIndex];
        if (
            currentGameType === "mega"
        ) {
            historyMegaIndex =
                move.megaIndex;
            historySmallIndex =
                move.smallIndex;
        }
    }
  if (historyIndex === currentGame.history.length) {
    leaveHistoryMode();
}
    updateHistoryButtons();
    renderCurrentGame();
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
    link.download = `${game.gameType}_TTT_${game.player1}_vs_${game.player2}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// ====== BUTTONS ======

btnClassicGame.onclick = () => {
    alert("Classic Tic Tac Toe Coming Soon");
};

btnUltimateGame.onclick = () => {
    currentGameType = "ultimate";
    showGameHomeScreen();
};

btnMegaGame.onclick = () => {
    currentGameType = "mega";
    showGameHomeScreen();
};

btnSuperGame.onclick = () => {
    alert("Super Tic Tac Toe Coming Soon");
};

btnBackToSelection.onclick = () => {
    showStartScreen();
};

btnNewGame.onclick = () => {
  showNewGamePopup();
};

btnCancelNew.onclick = () => {
  hideNewGamePopup();
};

const GAME_CREATORS = {
    mega: createEmptyGame,
    ultimate: createUltimateGame
};

btnCreateGame.onclick = () => {
    const p1 = player1Input.value.trim() || 'Player 1';
    const p2 = player2Input.value.trim() || 'Player 2';
    const player1Color = player1ColorSelect.value;
    const player2Color = player2ColorSelect.value;
    const game =
        GAME_CREATORS[
            currentGameType
        ](
            p1,
            p2,
            player1Color,
            player2Color
        );
    const games = loadSaves();
    games.push(game);
    saveAllGames(games);

    currentGame = game;
        clearSelections();

    resetHistoryView();
    historyIndex = 0;

    hideNewGamePopup();
    showMapScreen();
};

btnResumeGame.onclick = () => {
  showResumeScreen();
};

btnBackToStart.onclick = () => {
  showGameHomeScreen();
};

btnExitToStart.onclick = () => {
  currentGame = null;
  historyIndex = null;
  resetHistoryView();
  showGameHomeScreen();
};

turnArrowBtn.onclick = () => {
    if (viewingHistory) {
        leaveHistoryMode();
        renderCurrentGame();
        return;
    }
    if (
        currentGame.freeMove &&
        freeMoveSelection
    ) {
        currentGame.freeMove = false;
    }
    if (
        currentGame.freeMove &&
        !hasValidSelection()
    ) {
        return;
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
    showGameHomeScreen();
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
            if (!importedGame.gameType) {
                importedGame.gameType = "mega";
            }
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
