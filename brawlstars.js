const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 600;

// Game States
const gameState = {
    running: true,
    score: 0,
    enemiesDefeated: 0,
};

// Player Object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 25,
    height: 25,
    radius: 15,
    velocityX: 0,
    velocityY: 0,
    health: 100,
    maxHealth: 100,
    ammo: 50,
    maxAmmo: 50,
    speed: 4,
    dashCooldown: 0,
    dashSpeed: 12,
    rotation: 0,
    color: '#00d4ff',
    character: 'Gunner'
};

// Input handling
const keys = {};
const mouse = { x: canvas.width / 2, y: canvas.height / 2, clicked: false };

document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => { mouse.clicked = true; });
canvas.addEventListener('mouseup', () => { mouse.clicked = false; });

// Projectiles
const projectiles = [];

class Projectile {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.velocityX = (dx / dist) * 8;
        this.velocityY = (dy / dist) * 8;
        this.radius = 5;
        this.color = '#ffaa00';
        this.damage = 15;
        this.lifetime = 200;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.lifetime--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    isOutOfBounds() {
        return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height || this.lifetime <= 0;
    }
}

// Enemies
const enemies = [];

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 1.5;
        this.velocityX = 0;
        this.velocityY = 0;
        this.color = '#ff6b00';
        this.shootCooldown = 0;
    }

    update() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.velocityX = (dx / dist) * this.speed;
            this.velocityY = (dy / dist) * this.speed;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep in bounds
        if (this.x - this.radius < 0) this.x = this.radius;
        if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
        if (this.y - this.radius < 0) this.y = this.radius;
        if (this.y + this.radius > canvas.height) this.y = canvas.height - this.radius;

        // Shoot at player
        this.shootCooldown--;
        if (dist < 300 && this.shootCooldown <= 0) {
            projectiles.push(new Projectile(this.x, this.y, player.x, player.y));
            this.shootCooldown = 60;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2 * healthPercent, 4);
    }
}

// Power-ups
const powerups = [];

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health', 'ammo', 'speed'
        this.radius = 8;
        this.lifetime = 300;
        this.color = type === 'health' ? '#00ff00' : type === 'ammo' ? '#ffaa00' : '#ff00ff';
    }

    update() {
        this.lifetime--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    isOutOfBounds() {
        return this.lifetime <= 0;
    }
}

// Update function
function update() {
    // Player movement
    player.velocityX = 0;
    player.velocityY = 0;

    if (keys['w'] || keys['W']) player.velocityY = -player.speed;
    if (keys['s'] || keys['S']) player.velocityY = player.speed;
    if (keys['a'] || keys['A']) player.velocityX = -player.speed;
    if (keys['d'] || keys['D']) player.velocityX = player.speed;

    // Dash
    if (keys[' '] && player.dashCooldown <= 0) {
        player.velocityX *= player.dashSpeed;
        player.velocityY *= player.dashSpeed;
        player.dashCooldown = 120;
    }

    player.dashCooldown--;

    // Move player
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Keep player in bounds
    if (player.x - player.radius < 0) player.x = player.radius;
    if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;
    if (player.y - player.radius < 0) player.y = player.radius;
    if (player.y + player.radius > canvas.height) player.y = canvas.height - player.radius;

    // Player rotation
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    player.rotation = Math.atan2(dy, dx);

    // Shooting
    if (mouse.clicked && player.ammo > 0) {
        projectiles.push(new Projectile(player.x, player.y, mouse.x, mouse.y));
        player.ammo--;
    }

    // Reload
    if (keys['r'] || keys['R']) {
        player.ammo = player.maxAmmo;
    }

    // Auto reload ammo
    if (player.ammo < player.maxAmmo) {
        player.ammo = Math.min(player.ammo + 0.1, player.maxAmmo);
    }

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (projectiles[i].isOutOfBounds()) {
            projectiles.splice(i, 1);
        }
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();

        // Check collision with player
        const distToPlayer = Math.hypot(enemies[i].x - player.x, enemies[i].y - player.y);
        if (distToPlayer < enemies[i].radius + player.radius) {
            player.health -= 1;
        }

        // Check collision with projectiles
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const distToProjectile = Math.hypot(enemies[i].x - projectiles[j].x, enemies[i].y - projectiles[j].y);
            if (distToProjectile < enemies[i].radius + projectiles[j].radius) {
                enemies[i].health -= projectiles[j].damage;
                projectiles.splice(j, 1);
                gameState.score += 10;

                if (enemies[i].health <= 0) {
                    gameState.score += 50;
                    gameState.enemiesDefeated++;
                    
                    // Drop power-ups randomly
                    if (Math.random() < 0.3) {
                        const types = ['health', 'ammo', 'speed'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        powerups.push(new PowerUp(enemies[i].x, enemies[i].y, type));
                    }

                    enemies.splice(i, 1);
                }
                break;
            }
        }
    }

    // Update power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update();

        // Check collision with player
        const distToPlayer = Math.hypot(powerups[i].x - player.x, powerups[i].y - player.y);
        if (distToPlayer < powerups[i].radius + player.radius) {
            if (powerups[i].type === 'health') {
                player.health = Math.min(player.health + 25, player.maxHealth);
            } else if (powerups[i].type === 'ammo') {
                player.ammo = Math.min(player.ammo + 20, player.maxAmmo);
            } else if (powerups[i].type === 'speed') {
                player.speed = 6;
                setTimeout(() => { player.speed = 4; }, 5000);
            }
            powerups.splice(i, 1);
        } else if (powerups[i].isOutOfBounds()) {
            powerups.splice(i, 1);
        }
    }

    // Spawn enemies
    if (Math.random() < 0.01 + gameState.enemiesDefeated * 0.0001) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * canvas.width; y = -20; }
        else if (side === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
        else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
        else { x = -20; y = Math.random() * canvas.height; }
        enemies.push(new Enemy(x, y));
    }

    // Check game over
    if (player.health <= 0) {
        gameState.running = false;
    }

    // Update UI
    updateUI();
}

function updateUI() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('healthBarInner').style.width = healthPercent + '%';

    const ammoPercent = (player.ammo / player.maxAmmo) * 100;
    document.getElementById('ammoBarInner').style.width = ammoPercent + '%';

    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('enemiesDisplay').textContent = gameState.enemiesDefeated;
    document.getElementById('characterDisplay').textContent = player.character;
}

// Draw function
function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(15, 52, 96, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw player gun
    const gunLength = 20;
    const gunX = player.x + Math.cos(player.rotation) * gunLength;
    const gunY = player.y + Math.sin(player.rotation) * gunLength;
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(gunX, gunY);
    ctx.stroke();

    // Draw enemies
    enemies.forEach(enemy => enemy.draw());

    // Draw projectiles
    projectiles.forEach(proj => proj.draw());

    // Draw power-ups
    powerups.forEach(pup => pup.draw());

    // Draw game over screen
    if (!gameState.running) {
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalEnemies').textContent = gameState.enemiesDefeated;
        document.getElementById('gameOver').classList.add('show');
    }
}

// Game loop
function gameLoop() {
    if (gameState.running) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
