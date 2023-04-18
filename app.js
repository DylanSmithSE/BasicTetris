document.addEventListener("DOMContentLoaded", () => {
	const grid = document.querySelector(".grid");
	const scoreDisplay = document.querySelector("#score-display");
	const pauseButton = document.querySelector("#pause-btn");
	const newGameButton = document.querySelector("#new-game-btn");
	const resumeButton = document.querySelector("#resume-btn");
	const quitButton = document.querySelector("#quit-btn");
	const modal = document.getElementById("modal");
	const modalScoreTitle = document.querySelector(".score");
	const modalScore = document.querySelector(".modal-score");
	const modalScoreDisplay = document.querySelector("#modal-score-display");
	const width = 10;

	let level,
		timerID,
		score,
		linesCleared,
		speed,
		currentPosition,
		currentRotation,
		projection,
		projectionPosition;

	//Add squares to grid
	for (let i = 0; i < 200; i++) {
		var square = document.createElement("div");
		square.className = "square";
		grid.appendChild(square);
	}
	//Creating the bottom of the grid that no tetromino can occupy
	for (let i = 0; i < 10; i++) {
		var bottomSquare = document.createElement("div");
		bottomSquare.classList.add("taken");
		grid.appendChild(bottomSquare);
	}
	let squares = Array.from(document.querySelectorAll(".grid div"));

	//Tetromino orientations
	const lTetromino = [
		// [1, width + 1, width * 2 + 1, 2],
		// [width, width + 1, width + 2, width * 2 + 2],
		// [1, width + 1, width * 2 + 1, width * 2],
		// [width, width + 1, width + 2, 0],
		[0, width, width * 2, 1],
		[width - 1, width, width + 1, width * 2 + 1],
		[0, width, width * 2, width * 2 - 1],
		[width - 1, width, width + 1, -1],
	];
	const zTetromino = [
		// [1, 2, width, width + 1],
		// [0, width, width + 1, width * 2 + 1],
		// [1, 2, width, width + 1],
		// [0, width, width + 1, width * 2 + 1],
		[0, 1, width - 1, width],
		[0, width, width + 1, width * 2 + 1],
		[width, width + 1, width * 2 - 1, width * 2],
		[-1, width - 1, width, width * 2],
	];
	const tTetromino = [
		// [width, width + 1, width + 2, 1],
		// [1, width + 1, width * 2 + 1, width + 2],
		// [width, width + 1, width + 2, width * 2 + 1],
		// [1, width + 1, width * 2 + 1, width],
		[width - 1, width, width + 1, 0],
		[0, width, width * 2, width + 1],
		[width - 1, width, width + 1, width * 2],
		[0, width, width * 2, width - 1],
	];
	const oTetromino = [
		// [0, 1, width, width + 1],
		// [0, 1, width, width + 1],
		// [0, 1, width, width + 1],
		// [0, 1, width, width + 1],
		[0, 1, width, width + 1],
		[0, 1, width, width + 1],
		[0, 1, width, width + 1],
		[0, 1, width, width + 1],
	];
	const iTetromino = [
		// [1, width + 1, width * 2 + 1, width * 3 + 1],
		// [width, width + 1, width + 2, width + 3],
		// [1, width + 1, width * 2 + 1, width * 3 + 1],
		// [width, width + 1, width + 2, width + 3],
		[0, width, width * 2, width * 3],
		[width - 1, width, width + 1, width + 2],
		[0, width, width * 2, width * 3],
		[width - 1, width, width + 1, width + 2],
	];

	const tetrominoes = [
		lTetromino,
		zTetromino,
		tTetromino,
		oTetromino,
		iTetromino,
	];

	const colours = ["cyan", "red", "purple", "yellow", "blue"];

	//draw the tetromino
	function draw() {
		// console.log(`Current position: ${currentPosition}`);
		// console.log(current);
		current.forEach((index) => {
			squares[currentPosition + index].classList.add("tetromino");
			squares[currentPosition + index].style.backgroundColor =
				colours[currentIndex];
		});
	}

	//undraw the tetromino
	function unDraw() {
		current.forEach((index) => {
			squares[currentPosition + index].classList.remove("tetromino");
			squares[currentPosition + index].style.backgroundColor = "";
		});
	}

	//Get input from the user
	function control(e) {
		if (timerID) {
			if (e.keyCode === 27) {
				pause();
			} else if (e.keyCode === 37) {
				moveLeft();
			} else if (e.keyCode === 39) {
				moveRight();
			} else if (e.keyCode === 38) {
				rotateRight();
			} else if (e.keyCode === 40) {
				//points given for soft drop
				updateScore(level);
				moveDown();
			} else if (e.keyCode == 32) {
				hardDrop();
			}
			e.preventDefault();
		}
	}
	document.addEventListener("keydown", control);

	//Moves the tetromino down 1 position
	function moveDown() {
		unDraw();
		currentPosition += width;
		draw();
		freeze();
	}

	function freeze() {
		if (
			current.some((index) =>
				squares[currentPosition + index + width].classList.contains("taken")
			)
		) {
			current.forEach((index) =>
				squares[currentPosition + index].classList.add("taken")
			);
			checkForCompleteRow();
			//erase mini grid
			miniUnDraw();
			//get new tetromino falling
			currentPosition = 4;
			currentRotation = 0;
			currentIndex = upcomingTetrominoes.shift(); //used a index for both tetromino and colour arrays
			current = tetrominoes[currentIndex][currentRotation];
			upcomingTetrominoes.push(
				Math.floor(Math.random() * miniTetrominoes.length)
			);
			//check if the new tetromino enters an already occupied square
			if (
				current.some((index) =>
					squares[currentPosition + index].classList.contains("taken")
				)
			) {
				miniDraw();
				draw();
				gameOver();
				return;
			}
			updateProjection();
			miniDraw();
			draw();
			freeze();
		}
	}

	//move the tetromino left, unless it is in the left most position or another
	//tetromino blocks its way
	/* 
    isAtLeftEdge is first because checking for tetromino first led to error when tetromino 
    was in the first grid position and checked if the previous square (DNE) was taken 
    */
	function moveLeft() {
		//Check if the tetromino can move left without leaving the grid
		const isAtLeftEdge = current.some((index) => {
			return (currentPosition + index) % width === 0;
		});
		if (isAtLeftEdge) return;

		//Check if the tetromino can move left without hitting another tetromino
		const cantMoveLeft = current.some((index) => {
			return squares[currentPosition + index - 1].classList.contains("taken");
		});
		if (cantMoveLeft) return;

		unDraw();
		currentPosition -= 1;
		undrawProjection();
		updateProjection();
		draw();
		freeze();
	}

	//move the tetromino right, unless it is in the right most position or another
	//tetromino blocks its way
	/* 
    isAtRightEdge is first because checking for tetromino first led to error when tetromino 
    was in the first grid position and checked if the previous square (DNE) was taken 
    */
	function moveRight() {
		//Check if the tetromino can move left without leaving the grid
		const isAtRightEdge = current.some((index) => {
			return (currentPosition + index + 1) % width === 0;
		});
		if (isAtRightEdge) return;

		//Check if the tetromino can move left without hitting another tetromino
		const cantMoveRight = current.some((index) => {
			return squares[currentPosition + index + 1].classList.contains("taken");
		});
		if (cantMoveRight) return;

		unDraw();
		currentPosition += 1;
		undrawProjection();
		updateProjection();
		draw();
		freeze();
	}
	// timerID = setInterval(moveRight, speed);

	//Rotate the tetromino clockwise
	function rotateRight() {
		unDraw();
		if (tryToRotate()) {
			currentRotation = (currentRotation + 1) % 4;
			current = tetrominoes[currentIndex][currentRotation];
		}
		undrawProjection();
		updateProjection();
		draw();
		freeze();
	}

	//check if the tetromino can be rotated without entering another occupied square
	//check if the tetromino can be rotated without leaving the grid
	function tryToRotate() {
		let next = tetrominoes[currentIndex][(currentRotation + 1) % 4];

		//first check that by rotating, the tetromino doesn't occupy any taken squares
		if (
			next.some((index) => {
				return squares[currentPosition + index].classList.contains("taken");
			})
		) {
			// console.log("would rotate into another tetrominoe");
			return false;
		}
		// console.log("clear of other tetros");
		// console.log(`${next}, current position ${currentPosition}`);

		//ensure that the tetromino doesn't rotate off the board
		if (
			current.every((index) => {
				return (index + currentPosition) % width < 3; //first 3 squares
			})
		) {
			//check if the rotated tetromino remains in the grid
			if (
				next.some((index) => {
					return (index + currentPosition) % width > width - 4; //last 3 squares
				})
			) {
				// console.log("would rotate off the left");
				return false;
				// currentPosition++;
				// tryToRotate();
			}
		} else if (
			current.every((index) => {
				return (index + currentPosition) % width > width - 4; //last 3 squares
			})
		) {
			//check if the rotated tetromino remains in the grid
			if (
				next.some((index) => {
					return (index + currentPosition) % width < 3; //first 3 squares
				})
			) {
				// console.log("would rotate off the right");
				return false;
				// currentPosition--;
				// tryToRotate();
			}
		}
		return true;
	}

	function checkForCompleteRow() {
		let numOfCompleteRows = 0;
		let completedRow = [];
		for (let i = 0; i < 200; i += width) {
			let row = [];
			for (let j = 0; j < width; j++) {
				row.push(i + j);
			}
			if (
				row.every((index) => {
					return squares[index].classList.contains("tetromino", "taken");
				})
			) {
				completedRow = squares.splice(i, width);
				completedRow.forEach((element) => {
					element.classList.remove("tetromino", "taken");
					element.style.backgroundColor = "";
				});

				//add the removed row to the top of grid
				//IMPORTANT
				squares = completedRow.concat(squares);
				numOfCompleteRows++;
			}
		}
		if (numOfCompleteRows > 0) {
			squares.forEach((square) => {
				grid.appendChild(square);
			});
			linesCleared += numOfCompleteRows;
			clearedRows(numOfCompleteRows);
			updateLevel();
		}
	}
	function updateScore(points) {
		score += points;
		scoreDisplay.innerHTML = score;
	}
	function clearedRows(num) {
		switch (num) {
			case 1:
				updateScore(100 * level);
				break;
			case 2:
				updateScore(300 * level);
				break;
			case 3:
				updateScore(500 * level);
				break;
			case 4:
				updateScore(800 * level);
				break;
		}
	}
	function updateLevel() {
		let nextLevel = Math.trunc(linesCleared / 5) + 1;
		if (nextLevel > level) {
			level = nextLevel;
			speed *= 0.8;
			clearInterval(timerID);
			timerID = setInterval(moveDown, speed);
		}
	}
	function updateProjection() {
		projection = current;
		projectionPosition = currentPosition;
		while (
			projection.every((index) => {
				return !squares[projectionPosition + index + width].classList.contains(
					"taken"
				);
			})
		) {
			//while every square below projection is not taken lower projection
			projectionPosition += width;
		}
		drawProjection();
	}
	function drawProjection() {
		projection.forEach((index) => {
			squares[projectionPosition + index].classList.add("tetromino");
			squares[projectionPosition + index].style.backgroundColor = "black";
		});
	}
	function undrawProjection() {
		if (projection) {
			projection.forEach((index) => {
				squares[projectionPosition + index].classList.remove("tetromino");
				squares[projectionPosition + index].style.backgroundColor = "";
			});
		}
	}
	function hardDrop() {
		unDraw();
		//points given based on how far the tetromino is dropped
		updateScore((level * (projectionPosition - currentPosition)) / 10);
		currentPosition = projectionPosition;
		draw();
		freeze();
	}
	///////////////////////////////////////////////////////////////////////////////////////////////////
	/* Mini Grid */
	const miniGrid = document.querySelector(".miniGrid");
	const miniWidth = 6;

	//Add squares to grid
	for (let i = 0; i < 60; i++) {
		var square = document.createElement("div");
		square.className = "square";
		miniGrid.appendChild(square);
	}

	let miniSquares = Array.from(document.querySelectorAll(".miniGrid div"));

	//Controlling the mini tetromino orientations to lie flat
	//Saving the most space on the mini map
	const miniL = [[miniWidth - 1, miniWidth, miniWidth + 1, -1]];
	const miniZ = [[0, 1, miniWidth - 1, miniWidth]];
	const miniT = [[miniWidth - 1, miniWidth, miniWidth + 1, 0]];
	const miniO = [[-1, 0, miniWidth - 1, miniWidth]];
	const miniI = [[miniWidth - 1, miniWidth, miniWidth + 1, miniWidth + 2]];

	const miniTetrominoes = [miniL, miniZ, miniT, miniO, miniI];

	let miniPosition = 2;
	let miniRotation = 0;
	let upcomingTetrominoes;
	//draw the miniTetrominoes
	function miniDraw() {
		for (let t in upcomingTetrominoes) {
			miniTetrominoes[upcomingTetrominoes[t]][0].forEach((index) => {
				miniSquares[
					(3 * t + 1) * miniWidth + miniPosition + index
				].style.backgroundColor = colours[upcomingTetrominoes[t]];
			});
		}
	}

	//undraw the tetromino
	function miniUnDraw() {
		for (let t in upcomingTetrominoes) {
			miniTetrominoes[upcomingTetrominoes[t]][0].forEach((index) => {
				miniSquares[
					(3 * t + 1) * miniWidth + miniPosition + index
				].style.backgroundColor = "";
			});
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////
	/* Buttons and State */

	function pause() {
		clearInterval(timerID);
		timerID = null;
		modal.style.display = "flex";
		modalScore.style.display = "block";
		modalScoreDisplay.innerHTML = score;

		pauseButton.style.display = "none";
		resumeButton.style.display = "block";
		quitButton.style.display = "block";
	}
	pauseButton.addEventListener("click", pause);

	function resume() {
		modal.style.display = "none";
		modalScore.style.display = "none";
		resumeButton.style.display = "none";
		quitButton.style.display = "none";
		pauseButton.style.display = "block";
		timerID = setInterval(moveDown, speed);
	}
	resumeButton.addEventListener("click", resume);

	function gameOver() {
		clearInterval(timerID);
		timerID = null;
		modal.style.display = "flex";
		modalScore.style.display = "block";
		modalScoreDisplay.innerHTML = score;
		modalScoreDisplay.style.color = "red";
		modalScoreTitle.innerHTML = "GAME OVER";
		modalScoreTitle.style.color = "red";

		pauseButton.style.display = "none";
		newGameButton.style.display = "block";
	}

	function newGame() {
		//Need to reset all variables
		level = 1;
		score = 0;
		linesCleared = 0;
		speed = 1000; //how fast the tetrominoes fall
		currentPosition = 4;
		currentRotation = 0;
		//Randomly select a Tetromino in its first rotation
		currentIndex = Math.floor(Math.random() * tetrominoes.length);
		current = tetrominoes[currentIndex][currentRotation];

		//Randomly select 3 tetrominoes
		upcomingTetrominoes = [
			Math.floor(Math.random() * miniTetrominoes.length),
			Math.floor(Math.random() * miniTetrominoes.length),
			Math.floor(Math.random() * miniTetrominoes.length),
		];

		//clear grids
		squares.forEach((index) => {
			if (index.classList.contains("tetromino")) {
				index.classList.remove("tetromino");
				index.classList.remove("taken");
				index.style.backgroundColor = "";
			}
		});
		miniSquares.forEach((index) => {
			index.style.backgroundColor = "";
		});

		//Need to close modal
		modal.style.display = "none";
		modalScore.style.display = "none";
		resumeButton.style.display = "none";
		quitButton.style.display = "none";
		newGameButton.style.display = "none";
		pauseButton.style.display = "block";
		scoreDisplay.innerHTML = score;

		modalScoreDisplay.style.color = "black";
		modalScoreTitle.innerHTML = "Score";
		modalScoreTitle.style.color = "black";

		//start the game by drawing the first tetromino
		miniDraw();
		draw();
		updateProjection();
		//make the tetromino move down every second
		timerID = setInterval(moveDown, speed);
	}
	newGameButton.addEventListener("click", newGame);
	function quit() {
		modalScore.style.display = "none";
		resumeButton.style.display = "none";
		quitButton.style.display = "none";
		newGameButton.style.display = "block";
	}
	quitButton.addEventListener("click", quit);
});
