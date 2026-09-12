// Get canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const paddle = {
    x: 10,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    dy: 0,
    speed: 6
};

const computer = {
    x: canvas.width - 20,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    dy: 0,
    speed: 5
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    dx: 5,
    dy: 5,
    speed: 5
};

const game = {
    playerScore: 0,
    computerScore: 0,
    isRunning: false
};

// Keyboard input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse input handling
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    paddle.y = mouseY - paddle.height / 2;
    
    // Keep paddle within bounds
    if (paddle.y < 0) paddle.y = 0;
    if (paddle.y + paddle.height > canvas.height) {
        paddle.y = canvas.height - paddle.height;
    }
});

// Update paddle position with arrow keys
function updatePaddlePosition() {
    if (keys['ArrowUp'] && paddle.y > 0) {
        paddle.y -= paddle.speed;
    }
    if (keys['ArrowDown'] && paddle.y + paddle.height < canvas.height) {
        paddle.y += paddle.speed;
    }
}

// Update computer paddle (AI)
function updateComputerPaddle() {
    const computerCenter = computer.y + computer.height / 2;
    const difference = ball.y - computerCenter;
    
    if (Math.abs(difference) > 35) {
        if (difference > 0) {
            if (computer.y + computer.height < canvas.height) {
                computer.y += computer.speed;
            }
        } else {
            if (computer.y > 0) {
                computer.y -= computer.speed;
            }
        }
    }
}

// Update ball position
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy = -ball.dy;
    }
    if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.dy = -ball.dy;
    }
    
    // Ball collision with paddles
    if (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y > paddle.y &&
        ball.y < paddle.y + paddle.height
    ) {
        ball.x = paddle.x + paddle.width + ball.radius;
        ball.dx = -ball.dx;
        
        // Add spin based on where ball hits paddle
        let collidePoint = ball.y - (paddle.y + paddle.height / 2);
        collidePoint = collidePoint / (paddle.height / 2);
        ball.dy = collidePoint * ball.speed;
    }
    
    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.x = computer.x - ball.radius;
        ball.dx = -ball.dx;
        
        // Add spin based on where ball hits paddle
        let collidePoint = ball.y - (computer.y + computer.height / 2);
        collidePoint = collidePoint / (computer.height / 2);
        ball.dy = collidePoint * ball.speed;
    }
    
    // Ball out of bounds - score points
    if (ball.x - ball.radius < 0) {
        game.computerScore++;
        resetBall();
        updateScore();
    }
    if (ball.x + ball.radius > canvas.width) {
        game.playerScore++;
        resetBall();
        updateScore();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() > 0.5 ? 1 : -1) * 5;
}

// Draw functions
function drawPaddle(paddleObj) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddleObj.x, paddleObj.y, paddleObj.width, paddleObj.height);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddleObj.x, paddleObj.y, paddleObj.width, paddleObj.height);
}

function drawBall() {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawCenterLine();
    drawPaddle(paddle);
    drawPaddle(computer);
    drawBall();
}

// Update score display
function updateScore() {
    document.getElementById('playerScore').textContent = game.playerScore;
    document.getElementById('computerScore').textContent = game.computerScore;
}

// Game loop
function gameLoop() {
    if (game.isRunning) {
        updatePaddlePosition();
        updateComputerPaddle();
        updateBall();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Button controls
document.getElementById('startBtn').addEventListener('click', () => {
    game.isRunning = !game.isRunning;
    const btn = document.getElementById('startBtn');
    btn.textContent = game.isRunning ? 'Pause Game' : 'Start Game';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    game.playerScore = 0;
    game.computerScore = 0;
    game.isRunning = false;
    resetBall();
    updateScore();
    document.getElementById('startBtn').textContent = 'Start Game';
});

// Start the game loop
gameLoop();
