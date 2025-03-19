class Minesweeper {
    constructor() {
        this.rows = 9  //行数
        this.cols = 9  //列数
        this.mines = 10  //雷数
        this.boards = [] //棋盘
        this.firstClick = true //是否第一次点击
        this.flagged = 0 //旗帜数
        this.gameOver = false //是否结束
        this.startTime = 0 //开始时间
        this.endTime = 0 //结束时间
        this.timerInterval = null //计时器
        this.flaggedPositions = [] //旗帜的位置
        this.open = 0 //翻开数
        this.leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [] //排行榜
        this.difficulty = 'easy' //难度
    }

    //初始化游戏
    init() {
        this.boards = this.generateArray()
        this.gameOver = false
        this.firstClick = true
        this.flagged = 0
        this.startTime = 0
        this.endTime = 0
        this.flaggedPositions = []
        this.open = 0
        clearInterval(this.timerInterval)
        this.renderLeaderboard()
        this.render()
    }

    //渲染游戏
    render() {
        this.renderCells('#id-grid')
        this.recordFlagPositions()
        this.renderMineCounter()
        this.renderTimer()
    }

    // 生成初始的数组
    generateInitialArray() {
        let array = []
        let cell = { open: false, flag: false, }
        for (let i = 0; i < this.rows * this.cols; i++) {
            if (i < this.mines) {
                array.push({ ...cell, value: 9 })
            } else {
                array.push({ ...cell, value: 0 })
            }
        }
        return array
    }

    // 添加周围的雷数 + 1
    plus1(array, i, j) {
        if (this.isInRange(i, j)) {
            if (array[i][j].value !== 9) {
                array[i][j].value += 1
            }
        }
    }

    // 处理周围的雷数的逻辑
    handleMarkMines(array, i, j) {
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x !== 0 || y !== 0) {
                    this.plus1(array, i + x, j + y)
                }
            }
        }
    }

    // 标记周围的雷数
    markMines(array) {
        let square = array
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (array[i][j].value === 9) {
                    this.handleMarkMines(square, i, j)
                }
            }
        }
        return square
    }

    // 生成处理完后的数组
    generateArray() {
        let array = this.generateInitialArray()
        let shuffledArray = shuffle(array)
        let square = transformed(shuffledArray, this.rows, this.cols)
        let boards = this.markMines(square)
        return boards
    }

    // 在指定选择器中渲染游戏
    renderCells(selector) {
        let grid = e(selector)
        grid.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`
        grid.style.gridTemplateRows = `repeat(${this.rows}, 30px)`
        grid.innerHTML = ''
        let cellHtml = ''
        // 生成格子
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let cell = `
                    <div class="cell number-${this.boards[i][j].value} " data-row="${i}" data-col="${j}">
                    </div>
                `
                cellHtml += cell
            }
        }
        // 渲染格子
        appendHtml(grid, cellHtml)
    }

    // 渲染雷数
    renderMineCounter() {
        let mineCounter = e('#id-mine-counter')
        let mine = this.mines - this.flagged
        let mineStr = mine.toString()
        mineCounter.textContent = mineStr.padStart(2, '0')
    }

    // 格式化时间
    formatTime(time) {
        let minutes = Math.floor(time / 60)
        let seconds = time % 60
        return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`
    }

    // 开始计时
    startTimer() {
        this.startTime = Date.now()
        this.timerInterval = setInterval(() => {
            this.endTime = Date.now()
            this.renderTimer()
        }, 1000)
    }

    // 渲染时间
    renderTimer() {
        let timer = e('#id-timer')
        let time = Math.floor((this.endTime - this.startTime) / 1000)
        if (time < 0) {
            time = 0
        }
        timer.textContent = this.formatTime(time)
    }

    // 判断是否在范围内
    isInRange(i, j) {
        return i >= 0 && i < this.rows && j >= 0 && j < this.cols
    }

    // 判断是否需要翻开格子
    isOpenCell(i, j) {
        // 不在范围内
        let isInRange = (i >= 0 && i < this.rows && j >= 0 && j < this.cols)
        if (!isInRange) {
            return true
        }
        let isOpen = this.boards[i][j].open
        let isGameOver = this.gameOver
        let isFlag = this.boards[i][j].flag
        let isQuestion = this.boards[i][j].question
        return isOpen || isGameOver || isFlag || isQuestion
    }

    // 处理点击0格子时递归处理0格子的逻辑
    handleZeroCell(cell, i, j) {
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x !== 0 || y !== 0) {
                    if (!this.isOpenCell(i + x, j + y)) {
                        this.handleOpenCell(i + x, j + y)
                    }
                }
            }
        }
    }

    // 处理点击到雷时的逻辑
    handleMineCell(cell, i, j) {
        // let cell = e(`.cell[data-row="${i}"][data-col="${j}"]`)
        let mines = es('.number-9')
        cell.classList.add('mine')
        mines.forEach(mine => {
            if (!mine.classList.contains('flagged')) {
                mine.classList.add('revealed')
                mine.textContent = '💣'
            }
        })
        clearInterval(this.timerInterval)
        this.gameOver = true
        this.showCustomDialog()
    }

    // 处理点击安全格子时的逻辑
    handleSafeCell(cell, i, j) {
        // let cell = e(`.cell[data-row="${i}"][data-col="${j}"]`)
        cell.classList.add('revealed')
        cell.textContent = this.boards[i][j].value
    }

    // 初始化安全的棋盘
    initSafeBoard(i, j) {
        this.firstClick = false
        let value = this.boards[i][j].value
        while (value !== 0) {
            this.boards = this.generateArray()
            value = this.boards[i][j].value
            this.render()
        }
    }

    // 处理第一次点击的逻辑
    handleFirstClick(i, j) {
        this.initSafeBoard(i, j)
        this.startTimer()
    }

    // 处理点击所有格子时的逻辑
    handleClickCell(cell, i, j) {
        let board = this.boards[i][j]
        if (!board.open) {
            cell.classList.add('revealed')
            board.open = true
            this.open += 1
        }
    }

    // 处理翻开所有格子的逻辑
    handleOpenAllCell() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.handleOpenCell(i, j)
            }
        }
    }

    // 处理点击不同格子的逻辑
    handleDifferentCell(cell, i, j) {
        // 用表驱动法优化if else
        let board = this.boards[i][j]
        let actions = {
            9: () => { this.handleMineCell(cell, i, j) },
            0: () => { this.handleZeroCell(cell, i, j) },
            default: () => { this.handleSafeCell(cell, i, j) }
        }
        let action = actions[board.value] || actions.default
        action()
    }

    // 处理翻开格子的逻辑
    handleOpenCell(i, j) {
        // 判断是否是第一次点击
        if (this.firstClick) {
            this.handleFirstClick(i, j)
        }
        if (this.gameOver || this.boards[i][j].flag) {
            return
        }
        let cell = e(`.cell[data-row="${i}"][data-col="${j}"]`)
        // 处理点击格子的逻辑
        this.handleClickCell(cell, i, j)
        // 处理点击不同格子时的逻辑
        this.handleDifferentCell(cell, i, j)
        if (this.isWin() && !this.gameOver) {
            this.win() // 此方法会触发 showCustomDialog 弹窗
        }
    }


    // 处理插旗的逻辑
    handleFlagCell(cell, i, j) {
        let board = this.boards[i][j]
        board.flag = !board.flag
        cell.classList.toggle('flagged')
        if (board.flag) {
            this.flagged += 1
            this.flaggedPositions.push([i, j])
        } else {
            this.flagged -= 1
            this.flaggedPositions = this.flaggedPositions.filter(([x, y]) => {
                return x !== i || y !== j
            })
        }
        this.renderMineCounter()
    }

    // 记录旗帜的位置
    recordFlagPositions() {
        let flaggedPositions = this.flaggedPositions
        for (let i = 0; i < flaggedPositions.length; i++) {
            let x = flaggedPositions[i][0]
            let y = flaggedPositions[i][1]
            let cell = e(`.cell[data-row="${x}"][data-col="${y}"]`)
            cell.classList.add('flagged')
            this.boards[x][y].flag = true
        }
    }

    // 统计右击格子时周围旗帜数量
    countFlagsAround(i, j) {
        let count = 0
        for (let x = i - 1; x <= i + 1; x++) {
            for (let y = j - 1; y <= j + 1; y++) {
                if (this.isInRange(x, y) && this.boards[x][y].flag) {
                    count++
                }
            }
        }
        return count
    }

    // 处理难度的逻辑
    handleDifficulty(difficulty) {
        let settings = {
            easy: {
                rows: 9,
                cols: 9,
                mines: 10,
            },
            medium: {
                rows: 16,
                cols: 16,
                mines: 40,
            },
            hard: {
                rows: 16,
                cols: 30,
                mines: 99,
            },
        }
        if (settings[difficulty] !== undefined) {
            this.rows = settings[difficulty].rows
            this.cols = settings[difficulty].cols
            this.mines = settings[difficulty].mines
            this.init()
        }
    }

    // 处理翻开没有旗帜的格子的逻辑
    openNoFlagCell(i, j) {
        for (let x = i - 1; x <= i + 1; x++) {
            for (let y = j - 1; y <= j + 1; y++) {
                if (this.isInRange(x, y) && !this.boards[x][y].flag) {
                    this.handleOpenCell(x, y)
                }
            }
        }
    }

    // 给周围的格子添加动画
    addAnimation(i, j) {
        for (let x = i - 1; x <= i + 1; x++) {
            for (let y = j - 1; y <= j + 1; y++) {
                if (this.isInRange(x, y) && !this.boards[x][y].flag) {
                    let cell = e(`.cell[data-row="${x}"][data-col="${y}"]`)
                    cell.classList.add('revealed')
                    setTimeout(() => {
                        if (!this.boards[x][y].open) {
                            cell.classList.remove('revealed')
                        }
                    }, 100)
                }
            }
        }

    }

    // 处理右击格子的逻辑
    handleRightClickCell(cell, i, j) {
        let board = this.boards[i][j]
        if (!this.gameOver && !board.open) {
            this.handleFlagCell(cell, i, j)
        }
        if (board.open && board.value > 0 && !this.gameOver) {
            this.addAnimation(i, j)
            let flaggedCount = this.countFlagsAround(i, j)
            if (flaggedCount === board.value) {
                this.openNoFlagCell(i, j)
            }
        }

    }


    // 判断是否胜利
    isWin() {
        let cellOfNumber = this.rows * this.cols - this.mines
        let open = this.open
        return open === cellOfNumber
    }

    // 胜利  
    win() {
        let mines = es('.number-9')
        this.gameOver = true
        clearInterval(this.timerInterval)
        mines.forEach(mine => {
            if (!mine.classList.contains('flagged')) {
                mine.classList.add('flagged')
            }
        })
        this.showCustomDialog()
    }


    // 更新排行榜
    updateLeaderboard(time, difficulty, name) {
        const entry = { time, difficulty, name } // 包含姓名
        this.leaderboard.push(entry)
        // 先按难度排序，再按用时排序
        this.leaderboard.sort((a, b) => {
            const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 }
            if (difficultyOrder[a.difficulty] === difficultyOrder[b.difficulty]) {
                return a.time - b.time;
            } else {
                return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty]
            }
        })
        this.leaderboard = this.leaderboard.slice(0, 5) // 只保留前5名
        localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard))
        this.renderLeaderboard()
    }

    // 渲染排行榜
    renderLeaderboard() {
        const leaderboardList = e('#leaderboard-list')
        let players = this.leaderboard.map((item, index) => {
            return `<li>
                <span>${index + 1}</span>
                <span>${item.name}</span> 
                <span>${this.formatTime(item.time)}</span>
                <span>${item.difficulty}</span>
            </li>`
        }
        )
        leaderboardList.innerHTML = players.join('')
    }

    // 绑定左键点击事件
    bindEventLeftClick() {
        let grid = e('#id-grid')
        grid.addEventListener('click', (event) => {
            let cell = event.target
            let row = parseInt(cell.dataset.row, 10)
            let col = parseInt(cell.dataset.col, 10)
            if (cell.classList.contains('cell')) {
                this.handleOpenCell(row, col)
            }
        })
    }

    // 绑定右键点击事件
    bindEventRightClick() {
        let grid = e('#id-grid')
        grid.addEventListener('contextmenu', (event) => {
            event.preventDefault()
            let cell = event.target
            let row = parseInt(cell.dataset.row, 10)
            let col = parseInt(cell.dataset.col, 10)
            if (cell.classList.contains('cell')) {
                this.handleRightClickCell(cell, row, col)
            }
        })
    }

    // 绑定难度选择的点击事件
    bindEventDifficulty() {
        let difficultyPanel = e('.difficulty-panel')
        difficultyPanel.addEventListener('click', (event) => {
            let button = event.target
            console.log(button)
            // 移除所有难度按钮的active类
            rs('.difficulty-btn.active', 'active')
            // 添加当前难度按钮的active类
            button.classList.add('active')
            let difficulty = button.dataset.difficulty
            this.difficulty = difficulty
            this.handleDifficulty(difficulty)
        })
    }

    // 绑定点击新游戏事件
    bindEventNewGame() {
        let newGame = e('#id-button-new-game')
        newGame.addEventListener('click', () => {
            this.init()
        })
    }
    // 获取经过时间
    getTimer() {
        let time = Math.floor((this.endTime - this.startTime) / 1000)
        if (time < 0) {
            time = 0
        }
        return time
    }
    // 显示自定义弹窗
    showCustomDialog() {
        let time = this.getTimer();
        let input = this.isWin() ?
            `<input type="text" id="player-name" placeholder="请输入你的名字">` : ''
        let context = this.isWin() ?
            `恭喜你，你赢了🎉` :
            `你输了🎌`
        let dialog = `
            <div class= "win-dialog">
                <div class="win-box">
                    <h2>${context}</h2>
                    ${input}
                    <p>用时：${this.formatTime(time)}</p>
                    <p>难度：${this.difficulty}</p>
                    <button class="dialog-confirm">确定</button>
                    <button class="dialog-restart">再来一局</button>
                </div>
            </div >
            `
        appendHtml(document.body, dialog);
    }


    handleClickDialogButton() {
        if (this.isWin()) {
            let input = document.querySelector('#player-name')
            let name = input.value.trim() || '匿名玩家'
            let time = this.getTimer()
            let difficulty = this.difficulty
            this.updateLeaderboard(time, difficulty, name)
        }
        let dialog = document.querySelector('.win-dialog')
        dialog.remove()
    }


    // 绑定点击自定义弹窗按钮的事件
    bindEventCustomDialog() {
        let body = document.querySelector('body')
        bindEvent(body, 'click', (event) => {
            let self = event.target
            if (self.classList.contains('dialog-confirm')) {
                this.handleClickDialogButton()
            }
            if (self.classList.contains('dialog-restart')) {
                this.handleClickDialogButton()
                this.init()
            }
        })
    }


    // 绑定事件的集合
    bindEvents() {
        this.bindEventLeftClick()
        this.bindEventRightClick()
        this.bindEventNewGame()
        this.bindEventDifficulty()
        this.bindEventCustomDialog()
    }
}

const __main__ = () => {
    const game = new Minesweeper()
    game.init()
    game.bindEvents()
}

__main__()