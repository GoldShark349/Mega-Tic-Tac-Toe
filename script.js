// ====== BOARD FACTORIES ======

function createSmallBoard() {
    return {
        cells: new Array(9).fill(null),
        winner: null
    };
}
function createUltimateBoard() {
    const smallBoards = [];
    for (let i = 0; i < 9; i++) {
        smallBoards.push(
            createSmallBoard()
        );
    }
    return {
        children: smallBoards,
        winner: null
    };
}

function createMegaBoard() {
    const ultimateBoards = [];
    for (let i = 0; i < 9; i++) {
        ultimateBoards.push(
            createUltimateBoard()
        );
    }
    return {
        children: ultimateBoards,
        winner: null
    };
}
function createSuperBoard() {
    const megaBoards = [];
    for (let i = 0; i < 9; i++) {
        megaBoards.push(
            createMegaBoard()
        );
    }
    return {
        children: megaBoards,
        winner: null
    };
}

// ====== DATA MODEL ======

function createEmptyGame(
    player1,
    player2,
    player1Color,
    player2Color
) {

    const game =
        createGame(
            2,
            player1,
            player2,
            player1Color,
            player2Color
        );

    game.gameType =
        "mega";

    game.megaBoard =
        game.board.children;

    delete game.board;

    return game;
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
    if (
        game.gameType === "mega" &&
        !game.megaBoard &&
        game.board
    ) {
        game.megaBoard =
            game.board.children;
    }

    if (
        game.gameType === "ultimate" &&
        !game.ultimateBoard &&
        game.board
    ) {
        game.ultimateBoard =
            game.board.children;
    }

    if (
        game.gameType === "super" &&
        !game.superBoard &&
        game.board
    ) {
        game.superBoard =
            game.board;
    }
    if (!game.superViewPath) {
        game.superViewPath = [];
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
const tutorialContent = document.getElementById('tutorial-content');
const gameHomeTitle = document.getElementById("game-home-title");
const tutorialTitle = document.getElementById("tutorial-title");

// ====== GLOBAL STATE ======

let currentGame = null;
let historyIndex = null;
let viewingHistory = false;

let freeMoveSelection = null;
let currentGameType = "mega";

const GAME_CONFIGS = {
    classic: {
        title: "Tic Tac Toe"
    },
    ultimate: {
        title: "Ultimate Tic Tac Toe",
        depth: 1
    },
    mega: {
        title: "Mega Tic Tac Toe",
        depth: 2
    },
    super: {
        title: "Super Tic Tac Toe",
        depth: 3
    }
};

const TUTORIAL_CONTENT = {

    ultimate: `

        <h2>Objective</h2>
        <p>
            Ultimate Tic Tac Toe is made of nine Tic Tac Toe boards. Win three boards in a row to win.
        </p>

        <h2>Starting The Game</h2>
        <p>
            The game always starts in the center board.
        </p>

        <h2>Taking A Turn</h2>
        <p>
            Press Continue to enter the active board. Select an empty square to place your mark.
        </p>

        <h2>Board Routing</h2>
        <p>
            Where you play determines where your opponent must play next.
        </p>

        <h2>Free Moves</h2>
        <p>
            If the destination board has already been won, the next player receives a FREE MOVE and may play anywhere.
        </p>

        <h2>Winning</h2>
        <p>
            Capture three boards in a row horizontally, vertically, or diagonally.
        </p>

    `,
    mega: document.getElementById(
        "tutorial-content"
    ).innerHTML
};

function getGameHandler() {
    const type =
        currentGame
            ? currentGame.gameType
            : currentGameType;
    return GAME_HANDLERS[
        type
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
    },
    super: {
        renderMap: renderSuperMap,
        renderZoom: renderSuperZoom,
        handleMove() {},
        buildHistory(
            moveCount
        ) {
            return buildBoardFromHistoryGeneric(
                3,
                moveCount
            );
        }
    }
};

const THUMBNAIL_SIZE = 108;

const THUMBNAIL_COLORS = {
    background: "#222",
    megaLines: "#ffffff",
    ultimateLines: "#888888",
    smallLines: "#444444"
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
            games.filter(g => {
                const type =
                    g.gameType || "mega";
                return type ===
                    currentGameType;
            }).length === 0;
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
    updateHistoryButtons();
}

function showZoomScreen() {
    mapScreen.classList.add('hidden');
    zoomScreen.classList.remove('hidden');
    megaHomeScreen.classList.add('hidden');
    renderCurrentZoom();
}

function showTutorialScreen() {
    tutorialTitle.textContent =
        `${GAME_CONFIGS[currentGameType].title}
        Tutorial`;
    tutorialContent.innerHTML =
        TUTORIAL_CONTENT[
            currentGameType
        ] ||
        TUTORIAL_CONTENT.mega;
    startScreen.classList.add('hidden');
    megaHomeScreen.classList.add('hidden');
    resumeScreen.classList.add('hidden');
    mapScreen.classList.add('hidden');
    zoomScreen.classList.add('hidden');
    tutorialScreen.classList.remove(
        'hidden'
    );
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
}

function updateHistoryButtons() {
    const ui =
        getUIState();
    historyBack.disabled =
        ui.historyAtStart;
    historyForward.disabled =
        ui.historyAtEnd;
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
    freeMoveSelection =
        [...levels];
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

function isHighlightedBoard(
    boardIndex
) {
    const active =
        getHighlightedLevels();
    return active[0] === boardIndex;
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
    return pathsMatch(
        active.slice(0, 2),
        [
            ultimateIndex,
            smallIndex
        ]
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

function isLeafBoard(board) {

    return Array.isArray(
        board.cells
    );
}

function createBoardElement(
    board,
    player1Color,
    player2Color
) {
    if (isLeafBoard(board)) {
        return createMiniBoardElement(
            board,
            player1Color,
            player2Color
        );
    }
    const container =
        document.createElement("div");
    container.className =
        "ultimate-board";
    if (!board.winner) {
        board.children.forEach(
            child => {
                container.appendChild(
                    createBoardElement(
                        child,
                        player1Color,
                        player2Color
                    )
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
        ultimateBoard.children.forEach(
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
                ultimateBoard.children[
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
    return viewingHistory
        ? buildGameStateFromHistory(
            historyIndex
        )
        : getRootBoard();
}

function getSuperViewBoard() {
    let board =
        getRootBoard();
    for (
        const index of
        currentGame.superViewPath
    ) {
        board =
            board.children[index];
    }
    return board;
}

function buildGameStateFromHistory(
    moveCount
) {
    return getGameHandler()
        .buildHistory(
            moveCount
        );
}

function buildBoardFromHistoryGeneric(
    depth,
    moveCount
) {
    const root =
        depth === 1
            ? createBoard(1).children
            : createBoard(depth).children;
    currentGame.history
        .slice(0, moveCount)
        .forEach(move => {
            applyMove(
                root,
                getMovePath(move),
                move.cellIndex,
                move.player
            );
        });
    return root;
}

function shouldDisableContinue() {
    return (
        currentGame.gameOver ||
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
        currentGame.gameOver
    ) {
        return [];
    }
    if (
        currentGame.freeMove
    ) {
        return freeMoveSelection
            || [];
    }
    return [
        ...currentGame.currentPath
    ];
}

function clearThumbnail(ctx) {
    ctx.fillStyle =
        THUMBNAIL_COLORS.background;
    ctx.fillRect(
        0,
        0,
        THUMBNAIL_SIZE,
        THUMBNAIL_SIZE
    );
}

function getUIState() {
    return {
        gameOver:
            currentGame.gameOver,
        viewingHistory,
        historyAtStart:
            historyIndex <= 0,
        historyAtEnd:
            historyIndex >=
            currentGame.history.length
    };
}

function getRootBoard() {
    if (!currentGame) {
        return null;
    }
    switch (
        currentGame.gameType
    ) {
        case "ultimate":
            return currentGame.ultimateBoard;
        case "mega":
            return currentGame.megaBoard;
        case "super":
            return currentGame.superBoard;
    }
}

function getWinner(
    target
) {
    if (
        Array.isArray(target)
    ) {
        return checkWinner(
            target.map(
                item =>
                    item.winner
            )
        );
    }
    return getBoardWinner(
        target
    );
}

function getCurrentWinner() {
    return getWinner(
        getRootBoard()
    );
}

function updateRootWinner() {

    const root =
        getRootBoard();
    
    if (Array.isArray(root)) {
        return checkWinner(
            root.map(
                board =>
                    getBoardWinner(board)
            )
        );
    }
    return getBoardWinner(
        root
    );
}

function getGameDepth() {
    return GAME_CONFIGS[
        currentGameType
    ].depth;
}

function endGame(
    winner
) {
    currentGame.freeMove =
        false;
    currentGame.gameOver =
        true;
    clearSelections();
    showWinner(
        winner
    );
    updateGame(
        currentGame
    );
    showMapScreen();
}

function getBoardAtPath(
    root,
    path
) {
    let board = root;
    for (
        const index of path
    ) {
        if (
            Array.isArray(board)
        ) {
            board =
                board[index];
        } else {
            board =
                board.children[index];
        }
    }
    return board;
}

function getActiveBoard() {
    return getBoardAtPath(
        getRootBoard(),
        currentGame.currentPath
    );
}

function getCurrentPathString() {
    return currentGame.currentPath
        .map(
            value => value + 1
        )
        .join(" → ");
}

function pathsMatch(
    pathA,
    pathB
) {
    if (
        pathA.length !==
        pathB.length
    ) {
        return false;
    }
    return pathA.every(
        (value,index) =>
            value ===
            pathB[index]
    );
}

function createBoard(
    depth
) {
    if (
        depth === 0
    ) {
        return {
            cells:
                new Array(9)
                    .fill(null),
            winner: null
        };
    }
    return {
        children:
            Array.from(
                { length: 9 },
                () =>
                    createBoard(
                        depth - 1
                    )
            ),
        winner: null
    };
}

function createGame(
    depth,
    player1,
    player2,
    player1Color,
    player2Color
) {
    return {
        id: Date.now(),
        gameType:
            currentGameType,
        player1,
        player2,
        player1Color,
        player2Color,
        board:
            createBoard(
                depth
            ),
        currentPath:
            Array(depth)
                .fill(4),
        currentPlayer:"X",
        freeMove:false,
        gameOver:false,
        history:[],
        lastPlayed:
            new Date()
                .toISOString()
    };
}

function getRootArray() {
    const root =
        getRootBoard();
    return Array.isArray(root)
        ? root
        : root.children;
}

function getBoardFromMovePath(
    ...path
) {
    return getBoardAtPath(
        getRootBoard(),
        path
    );
}

function getMovePath(
    move
) {
    if (move.path) {
        return move.path;
    }
    if (
        move.megaIndex !== undefined
    ) {
        return [
            move.megaIndex,
            move.smallIndex
        ];
    }
    return [
        move.boardIndex
    ];
}

function applyMove(
    rootBoard,
    path,
    cellIndex,
    player
) {
    const board =
        getBoardAtPath(
            rootBoard,
            path
        );
    if (
        board.cells[cellIndex]
        !== null
    ) {
        return false;
    }
    
    board.cells[cellIndex] =
        player;

    rebuildWinners(
        Array.isArray(rootBoard)
            ? {
                children: rootBoard
            }
            : rootBoard
    );
    return true;
}

function performMove(
    path,
    cellIndex
) {
    const player =
        currentGame.currentPlayer;
    const root =
        getRootBoard();
    const success =
        applyMove(
            root,
            path,
            cellIndex,
            player
        );
    if (!success) {
        return false;
    }
    currentGame.history.push({
        path,
        cellIndex,
        player
    });
    historyIndex =
        currentGame.history.length;
    const gameWinner =
        updateRootWinner();
    if (gameWinner) {
        endGame(
            gameWinner
        );
        return true;
    }
    const nextPath =
        getNextDestinationPath(
            path,
            cellIndex
        );
    const destination =
        getDestinationBoard(
            root,
            nextPath
        );
    if (
        !isDestinationPlayable(
            root,
            nextPath
        )
    ) {
        currentGame.freeMove = true;
    }
    else {
        currentGame.freeMove = false;
        clearSelections();
        setCurrentBoard(
            ...nextPath
        );
    }
    switchPlayer();
    currentGame.lastPlayed =
        new Date().toISOString();
    updateGame(
        currentGame
    );
    showMapScreen();
    return true;
}

function getNextDestinationPath(
    movePath,
    cellIndex
) {
    return [
        ...movePath.slice(1),
        cellIndex
    ];
}

function getDestinationBoard(
    root,
    path
) {
    try {
        return getBoardAtPath(
            root,
            path
        );
    }
    catch {
        return null;
    }
}

function isDestinationPlayable(
    root,
    path
) {
    for (
        let length = 1;
        length <= path.length;
        length++
    ) {
        const board =
            getDestinationBoard(
                root,
                path.slice(
                    0,
                    length
                )
            );
        if (
            !isBoardPlayable(
                board
            )
        ) {
            return false;
        }
    }
    return true;
}

function renderSuperZoom() {
    zoomBoardDiv.innerHTML = "";
}

player1ColorSelect.onchange =
    updateAvailableColors;

player2ColorSelect.onchange =
    updateAvailableColors;

// helper end

// ====== GENERIC GRID DRAWER ======

function drawGrid(
    ctx,
    size,
    divisions,
    color,
    width
) {

    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    const step =
        size / divisions;

    for (
        let i = 1;
        i < divisions;
        i++
    ) {

        const pos = i * step;

        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(size, pos);
        ctx.stroke();
    }
}

// ====== THUMBNAIL RENDERERS ======

function drawMegaThumbnail(
    ctx,
    game
) {
    clearThumbnail(ctx);
    rebuildUltimateWinnersForGame(
        game
    );
    drawGrid(
        ctx,
        THUMBNAIL_SIZE,
        9,
        THUMBNAIL_COLORS.smallLines,
        1
    );
    drawGrid(
        ctx,
        THUMBNAIL_SIZE,
        3,
        THUMBNAIL_COLORS.megaLines,
        3
    );
    const megaSize =
        THUMBNAIL_SIZE / 3;
    const smallSize =
        megaSize / 3;
    game.megaBoard.forEach(
        (ultimateBoard, megaIndex) => {
            const megaRow =
                Math.floor(
                    megaIndex / 3
                );
            const megaCol =
                megaIndex % 3;
            const megaX =
                megaCol * megaSize;
            const megaY =
                megaRow * megaSize;
            if (
                ultimateBoard.winner
            ) {
                ctx.fillStyle =
                    ultimateBoard.winner === "X"
                    ? game.player1Color
                    : game.player2Color;
                ctx.fillRect(
                    megaX,
                    megaY,
                    megaSize,
                    megaSize
                );
                return;
            }
            ultimateBoard.children.forEach(
                (
                    smallBoard,
                    smallIndex
                ) => {
                    if (
                        !smallBoard.winner
                    ) {
                        return;
                    }
                    const smallRow =
                        Math.floor(
                            smallIndex / 3
                        );
                    const smallCol =
                        smallIndex % 3;
                    ctx.fillStyle =
                        smallBoard.winner === "X"
                        ? game.player1Color
                        : game.player2Color;
                    ctx.fillRect(
                        megaX +
                        smallCol *
                        smallSize,
                        megaY +
                        smallRow *
                        smallSize,
                        smallSize,
                        smallSize
                    );
                }
            );
        }
    );
}

function drawUltimateThumbnail(
    ctx,
    game
) {
    clearThumbnail(ctx);
    drawGrid(
        ctx,
        THUMBNAIL_SIZE,
        9,
        THUMBNAIL_COLORS.smallLines,
        1
    );
    drawGrid(
        ctx,
        THUMBNAIL_SIZE,
        3,
        THUMBNAIL_COLORS.megaLines,
        3
    );
    const boardSize =
        THUMBNAIL_SIZE / 3;
    game.ultimateBoard.forEach(
        (board, boardIndex) => {
            const row =
                Math.floor(
                    boardIndex / 3
                );
            const col =
                boardIndex % 3;
            const x =
                col * boardSize;
            const y =
                row * boardSize;
            if (board.winner) {
                ctx.fillStyle =
                    board.winner === "X"
                    ? game.player1Color
                    : game.player2Color;
                ctx.fillRect(
                    x,
                    y,
                    boardSize,
                    boardSize
                );
                return;
            }
            const cellSize =
                boardSize / 3;
            board.cells.forEach(
                (
                    cell,
                    cellIndex
                ) => {
                    if (!cell) {
                        return;
                    }
                    const cellRow =
                        Math.floor(
                            cellIndex / 3
                        );
                    const cellCol =
                        cellIndex % 3;
                    ctx.fillStyle =
                        cell === "X"
                        ? game.player1Color
                        : game.player2Color;
                    ctx.fillRect(
                        x +
                        cellCol *
                        cellSize,
                        y +
                        cellRow *
                        cellSize,
                        cellSize,
                        cellSize
                    );
                }
            );
        }
    );
}

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
            const board =
                game.gameType === "ultimate"
                    ? game.ultimateBoard
                    : game.gameType === "mega"
                    ? game.megaBoard
                    : game.superBoard;
            return getWinner(board);
        });
    }

    if (saveFilter.value === "unfinished") {
        games = games.filter(game => {
            const board =
                game.gameType === "ultimate"
                    ? game.ultimateBoard
                    : game.gameType === "mega"
                    ? game.megaBoard
                    : game.superBoard;
                return !getWinner(board);
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

thumbnail.width = 108;
thumbnail.height = 108;

thumbnail.style.width = "54px";
thumbnail.style.height = "54px";

const ctx =
    thumbnail.getContext('2d');

if (game.gameType === "mega") {
    drawMegaThumbnail(
        ctx,
        game
    );
}
else if (game.gameType === "ultimate") {
    drawUltimateThumbnail(
        ctx,
        game
    );
}
        
    wrapper.style.border = '1px solid #555';
    wrapper.style.margin = '5px';
    wrapper.style.padding = '5px';

const title = document.createElement('div');

let gameWinner = null;

if (
    game.gameType === "mega"
) {
    rebuildUltimateWinnersForGame(
        game
    );
    gameWinner =
        getWinner(
            game.megaBoard
        );

}
else if (
    game.gameType === "ultimate"
) {
    gameWinner =
        getWinner(
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

            const path =
                getMovePath(move);

            const key =
                path.join("-");

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

    return ultimateWinners;
}

// ====== REPLAY BOARD BUILDER ======

function buildBoardFromHistory(
    moveCount
) {
    return buildBoardFromHistoryGeneric(
        2,
        moveCount
    );
}

function buildUltimateBoardFromHistory(
    moveCount
) {
    return buildBoardFromHistoryGeneric(
        1,
        moveCount
    );
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
                        getRootArray()[index];
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
                    currentGame.currentPath[0]
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
        getCurrentWinner()
    );
    
    renderMegaNestedMap();
    
    updateHistoryButtons();
    
    updateContinueButton();
    
    return;
}

// ====== SUPER MAP RENDERING ======

function renderSuperMap() {

    updateFreeMoveBanner();

    updateGameTitle(
        getCurrentWinner()
    );

    megaBoardDiv.innerHTML = "";

    const board =
        getSuperViewBoard();

    const container =
        document.createElement("div");

    container.className =
        "mega-board-grid";

    board.children.forEach(
        (child, index) => {
            const element =
                createBoardElement(
                    child,
                    currentGame.player1Color,
                    currentGame.player2Color
                );
            element.onclick = () => {
                if (
                    isLeafBoard(child)
                ) {
                    return;
                }
                currentGame
                    .superViewPath
                    .push(index);
                renderSuperMap();
            };
            container.appendChild(
                element
            );
        }
    );
    megaBoardDiv.appendChild(
        container
    );
    updateHistoryButtons();
    
    updateContinueButton();
}
// ====== ULTIMATE MAP RENDERING ======

function renderUltimateMap() {
    updateFreeMoveBanner();
    
    updateGameTitle(
        getCurrentWinner()
    );

    megaBoardDiv.innerHTML = '';
    const boardSet =
        viewingHistory
            ? buildGameStateFromHistory(
                historyIndex
            )
            : getRootArray();
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
            pathsMatch(
                freeMoveSelection,
                [boardIndex]
            )
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

    zoomTitle.textContent =
        getCurrentPathString();

    zoomBoardDiv.innerHTML = '';

    const activeBoard =
        getActiveBoard();

    activeBoard.cells.forEach((cell, cIndex) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'zoom-cell';
    if (cell === 'X') {
        cellDiv.style.background = currentGame.player1Color;
    }
    else if (cell === 'O') {
    cellDiv.style.background = currentGame.player2Color;
    }

    cellDiv.onclick = () => {
      handleCurrentMove(
            ...currentGame.currentPath,
            cIndex
        );
    };

    zoomBoardDiv.appendChild(cellDiv);
  });
}

function renderUltimateZoom() {
    zoomBoardDiv.innerHTML = '';
    const board =
        getActiveBoard();
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
                    ...currentGame.currentPath,
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
    return getWinnerFromChildren(
        boards
    );
}

function getWinnerFromChildren(
    children
) {
    return checkWinner(
        children.map(
            child => child.winner
        )
    );
}

function rebuildWinners(
    board
) {
    if (isLeafBoard(board)) {
        board.winner =
            checkWinner(
                board.cells
            );
        return board.winner;
    }
    board.children.forEach(
        rebuildWinners
    );
    board.winner =
        getWinnerFromChildren(
            board.children
        );
    return board.winner;
}

function getBoardWinner(
    board
) {
    rebuildWinners(board);
    return board.winner;
}

function checkBoardWinner(
    board
) {
    return getBoardWinner(
        board
    );
}

function rebuildUltimateWinners() {
    getRootArray().forEach(
        getBoardWinner
    );
}

function rebuildUltimateWinnersForGame(
    game
) {
    game.megaBoard.forEach(
        getBoardWinner
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

function handleCellClick(
    mIndex,
    sIndex,
    cIndex
) {

    performMove(
        [mIndex, sIndex],
        cIndex
    );
}

function handleUltimateMove(
    boardIndex,
    cellIndex
) {
    performMove(
        [boardIndex],
        cellIndex
    );
}
    
// ====== ULTIMATE GAME DATA ======

function createUltimateGame(
    player1,
    player2,
    player1Color,
    player2Color
) {

    const game =
        createGame(
            1,
            player1,
            player2,
            player1Color,
            player2Color
        );

    game.gameType =
        "ultimate";

    game.ultimateBoard =
        game.board.children;

    delete game.board;

    return game;
}

// ====== SUPER GAME DATA ======

function createSuperGame(
    player1,
    player2,
    player1Color,
    player2Color
) {

    const game =
        createGame(
            3,
            player1,
            player2,
            player1Color,
            player2Color
        );

    game.gameType =
        "super";

    game.superBoard =
        game.board;

    game.superViewPath = [];
    
    delete game.board;

    return game;
}

// ====== HISTORY ======

historyBack.onclick = () => {
    if (historyIndex <= 0) return;
    historyIndex--;
    viewingHistory = true;
    freeMoveBanner.classList.add('hidden');
    const move = currentGame.history[historyIndex];
    updateHistoryButtons();
    renderCurrentGame();
};

historyForward.onclick = () => {
  if (historyIndex >= currentGame.history.length) return;
  historyIndex++;
    if (historyIndex < currentGame.history.length) {
        const move = currentGame.history[historyIndex];
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
    ultimate: createUltimateGame,
    super: createSuperGame
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
    if (
        currentGame.gameOver
    ) {
        return;
    }
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
    if (
        currentGame.gameType === "super" &&
        currentGame.superViewPath.length > 0
    ) {
        currentGame.superViewPath.pop();
        renderSuperMap();
        return;
    }
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
