// Game Configuration
const CONFIG = {
    gravity: 0.4,
    swingSpeed: 0.08,
    releaseBoost: 1.2,
    maxVelocity: 15,
    playerRadius: 15,
    anchorRadius: 12,
    goalRadius: 30,
    ropeWidth: 3
};

// Game State
let canvas, ctx;
let gameState = 'start'; // start, playing, gameOver, levelComplete
let currentLevel = 1;
let score = 0;

// Player
let player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    ropeLength: 0,
    attached: false,
    attachedAnchor: null
};

// Level Data
let anchors = [];
let obstacles = [];
let goal = null;
let levelStartX = 0;

// Camera
let camera = { x: 0, y: 0 };

// Initialize Game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Input Events - document level for better responsiveness
    document.addEventListener('mousedown', handleInput);
    document.addEventListener('mouseup', handleRelease);
    document.addEventListener('touchstart', (e) => {
        if (gameState === 'playing') {
            e.preventDefault();
            handleInput(e.touches[0]);
        }
    }, { passive: false });
    document.addEventListener('touchend', (e) => {
        if (gameState === 'playing') {
            e.preventDefault();
            handleRelease();
        }
    }, { passive: false });

    // Button Events
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('retry-btn').addEventListener('click', restartGame);
    document.getElementById('next-level-btn').addEventListener('click', nextLevel);

    // Start animation loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Level Generation
function generateLevel(levelNum) {
    anchors = [];
    obstacles = [];

    const levelLength = 800 + levelNum * 400;
    const anchorCount = 8 + levelNum * 3;
    const obstacleCount = Math.min(levelNum * 2, 10);

    // Starting position
    levelStartX = 100;
    player.x = levelStartX;
    player.y = canvas.height * 0.6;
    player.vx = 2;
    player.vy = 0;
    player.attached = false;
    player.attachedAnchor = null;

    // Generate anchors along the path
    for (let i = 0; i < anchorCount; i++) {
        const progress = i / (anchorCount - 1);
        anchors.push({
            x: 150 + progress * levelLength,
            y: 80 + Math.sin(i * 0.8) * 60 + Math.random() * 40,
            radius: CONFIG.anchorRadius
        });
    }

    // Generate obstacles
    for (let i = 0; i < obstacleCount; i++) {
        const progress = (i + 1) / (obstacleCount + 1);
        obstacles.push({
            x: 200 + progress * levelLength * 0.8,
            y: canvas.height * 0.5 + Math.random() * 100,
            width: 60 + Math.random() * 40,
            height: 80 + Math.random() * 60,
            rotation: Math.random() * 0.3 - 0.15
        });
    }

    // Goal position
    goal = {
        x: levelLength + 100,
        y: canvas.height * 0.5,
        radius: CONFIG.goalRadius,
        pulsePhase: 0
    };

    camera.x = 0;
    camera.y = 0;
}

// Input Handling
function handleInput(e) {
    if (gameState !== 'playing') return;

    // Ignore clicks on buttons
    if (e.target && e.target.tagName === 'BUTTON') return;

    if (!player.attached) {
        // Find nearest anchor in range (no height restriction)
        let nearestAnchor = null;
        let nearestDist = Infinity;
        const maxRange = 300;

        for (const anchor of anchors) {
            const dx = anchor.x - player.x;
            const dy = anchor.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only check distance, allow any direction
            if (dist < maxRange && dist < nearestDist) {
                nearestDist = dist;
                nearestAnchor = anchor;
            }
        }

        if (nearestAnchor) {
            attachToAnchor(nearestAnchor);
        }
    }
}

function handleRelease() {
    if (gameState !== 'playing') return;

    if (player.attached) {
        releaseRope();
    }
}

function attachToAnchor(anchor) {
    player.attached = true;
    player.attachedAnchor = anchor;

    const dx = player.x - anchor.x;
    const dy = player.y - anchor.y;
    player.ropeLength = Math.sqrt(dx * dx + dy * dy);
    player.angle = Math.atan2(dy, dx);

    // Convert linear velocity to angular velocity
    const tangentX = -Math.sin(player.angle);
    const tangentY = Math.cos(player.angle);
    const tangentVelocity = player.vx * tangentX + player.vy * tangentY;
    player.angularVelocity = tangentVelocity / player.ropeLength;
}

function releaseRope() {
    player.attached = false;

    // Convert angular velocity back to linear with boost
    const tangentX = -Math.sin(player.angle);
    const tangentY = Math.cos(player.angle);
    const speed = player.angularVelocity * player.ropeLength * CONFIG.releaseBoost;

    player.vx = tangentX * speed;
    player.vy = tangentY * speed;

    // Cap velocity
    const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (currentSpeed > CONFIG.maxVelocity) {
        player.vx = (player.vx / currentSpeed) * CONFIG.maxVelocity;
        player.vy = (player.vy / currentSpeed) * CONFIG.maxVelocity;
    }

    player.attachedAnchor = null;
}

// Physics Update
function updatePhysics() {
    if (player.attached) {
        // Pendulum physics
        const anchor = player.attachedAnchor;
        const gravityForce = CONFIG.gravity * Math.cos(player.angle);
        player.angularVelocity += gravityForce / player.ropeLength * CONFIG.swingSpeed;

        // Damping
        player.angularVelocity *= 0.998;

        // Update angle
        player.angle += player.angularVelocity;

        // Update position based on angle
        player.x = anchor.x + Math.cos(player.angle) * player.ropeLength;
        player.y = anchor.y + Math.sin(player.angle) * player.ropeLength;

        // Update velocity for smooth transition when releasing
        player.vx = -Math.sin(player.angle) * player.angularVelocity * player.ropeLength;
        player.vy = Math.cos(player.angle) * player.angularVelocity * player.ropeLength;
    } else {
        // Free fall physics
        player.vy += CONFIG.gravity;
        player.x += player.vx;
        player.y += player.vy;

        // Air resistance
        player.vx *= 0.999;
        player.vy *= 0.999;
    }

    // Update camera to follow player
    const targetCameraX = player.x - canvas.width * 0.3;
    camera.x += (targetCameraX - camera.x) * 0.1;
    camera.x = Math.max(0, camera.x);

    // Check boundaries
    if (player.y > canvas.height + 50 || player.y < -100) {
        gameOver();
    }

    if (player.x < camera.x - 100) {
        gameOver();
    }

    // Check obstacle collision
    for (const obs of obstacles) {
        if (checkObstacleCollision(player, obs)) {
            gameOver();
            return;
        }
    }

    // Check goal
    if (goal) {
        const dx = player.x - goal.x;
        const dy = player.y - goal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < goal.radius + CONFIG.playerRadius) {
            levelComplete();
        }
    }
}

function checkObstacleCollision(player, obs) {
    // Simple AABB collision with some margin
    const margin = CONFIG.playerRadius * 0.7;
    return player.x > obs.x - obs.width / 2 - margin &&
           player.x < obs.x + obs.width / 2 + margin &&
           player.y > obs.y - obs.height / 2 - margin &&
           player.y < obs.y + obs.height / 2 + margin;
}

// Rendering
function render() {
    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    drawStars();

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw rope
    if (player.attached && player.attachedAnchor) {
        drawRope(player.attachedAnchor, player);
    }

    // Draw anchor range indicators
    if (gameState === 'playing' && !player.attached) {
        drawAnchorRanges();
    }

    // Draw anchors
    for (const anchor of anchors) {
        drawAnchor(anchor);
    }

    // Draw obstacles
    for (const obs of obstacles) {
        drawObstacle(obs);
    }

    // Draw goal
    if (goal) {
        drawGoal(goal);
    }

    // Draw player
    drawPlayer();

    ctx.restore();

    // Draw instructions if early in game
    if (gameState === 'playing' && player.x < levelStartX + 200) {
        drawInstructions();
    }
}

function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const seed = 12345;
    for (let i = 0; i < 50; i++) {
        const x = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280 * canvas.width;
        const y = ((seed * (i + 1) * 7919 + 12345) % 233280) / 233280 * canvas.height;
        const size = ((seed * (i + 1) * 3571) % 233280) / 233280 * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawRope(anchor, player) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = CONFIG.ropeWidth;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y);
    ctx.lineTo(player.x, player.y);
    ctx.stroke();

    // Rope glow
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = CONFIG.ropeWidth + 4;
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y);
    ctx.lineTo(player.x, player.y);
    ctx.stroke();
}

function drawAnchorRanges() {
    const maxRange = 300;
    for (const anchor of anchors) {
        const dx = anchor.x - player.x;
        const dy = anchor.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxRange) {
            const alpha = 1 - (dist / maxRange);
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.3})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(anchor.x, anchor.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

function drawAnchor(anchor) {
    // Outer glow
    const gradient = ctx.createRadialGradient(
        anchor.x, anchor.y, 0,
        anchor.x, anchor.y, anchor.radius * 2
    );
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
    gradient.addColorStop(0.5, 'rgba(102, 126, 234, 0.3)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, anchor.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Main anchor
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, anchor.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(anchor.x - 3, anchor.y - 3, anchor.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawObstacle(obs) {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    ctx.rotate(obs.rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-obs.width / 2 + 5, -obs.height / 2 + 5, obs.width, obs.height);

    // Main body
    const gradient = ctx.createLinearGradient(-obs.width / 2, 0, obs.width / 2, 0);
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, '#c0392b');
    ctx.fillStyle = gradient;
    ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height * 0.3);

    // Border
    ctx.strokeStyle = '#962d22';
    ctx.lineWidth = 3;
    ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

    ctx.restore();
}

function drawGoal(goal) {
    goal.pulsePhase += 0.05;
    const pulse = Math.sin(goal.pulsePhase) * 0.2 + 1;

    // Outer glow
    const gradient = ctx.createRadialGradient(
        goal.x, goal.y, 0,
        goal.x, goal.y, goal.radius * 2.5 * pulse
    );
    gradient.addColorStop(0, 'rgba(46, 204, 113, 0.8)');
    gradient.addColorStop(0.5, 'rgba(46, 204, 113, 0.3)');
    gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, goal.radius * 2.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Main goal
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, goal.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Star icon
    ctx.fillStyle = '#fff';
    ctx.font = `${goal.radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', goal.x, goal.y);
}

function drawPlayer() {
    const x = player.x;
    const y = player.y;

    // Calculate swing angle for limb animation
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    const swingPhase = Date.now() * 0.01;
    const limbSwing = Math.sin(swingPhase) * Math.min(speed * 0.05, 0.5);

    // Body rotation based on velocity
    const bodyAngle = Math.atan2(player.vy, player.vx) + Math.PI / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(player.attached ? bodyAngle * 0.3 : bodyAngle * 0.5);

    // Stickman dimensions
    const headRadius = 10;
    const bodyLength = 25;
    const limbLength = 18;
    const lineWidth = 4;

    ctx.strokeStyle = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Glow effect
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    // Head
    ctx.beginPath();
    ctx.arc(0, -bodyLength - headRadius, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -bodyLength);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    // Left arm
    ctx.moveTo(0, -bodyLength + 5);
    ctx.lineTo(-limbLength * Math.cos(0.5 + limbSwing), -bodyLength + 5 + limbLength * Math.sin(0.5 + limbSwing));
    // Right arm
    ctx.moveTo(0, -bodyLength + 5);
    ctx.lineTo(limbLength * Math.cos(0.5 - limbSwing), -bodyLength + 5 + limbLength * Math.sin(0.5 - limbSwing));
    ctx.stroke();

    // Legs
    ctx.beginPath();
    // Left leg
    ctx.moveTo(0, 0);
    ctx.lineTo(-limbLength * Math.cos(0.3 - limbSwing), limbLength * Math.sin(0.3 + limbSwing) + 5);
    // Right leg
    ctx.moveTo(0, 0);
    ctx.lineTo(limbLength * Math.cos(0.3 + limbSwing), limbLength * Math.sin(0.3 - limbSwing) + 5);
    ctx.stroke();

    // Eyes on head
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(-3, -bodyLength - headRadius, 2, 0, Math.PI * 2);
    ctx.arc(3, -bodyLength - headRadius, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Trail effect
    const trailLength = 4;
    for (let i = 1; i <= trailLength; i++) {
        const alpha = (1 - i / trailLength) * 0.2;
        const offset = i * 4;
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
            x - player.vx * offset * 0.2,
            y - player.vy * offset * 0.2,
            8, 0, Math.PI * 2
        );
        ctx.stroke();
    }
}

function drawInstructions() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('클릭: 줄 연결 | 놓기: 날아가기', canvas.width / 2, canvas.height - 30);
}

// Game State Management
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameState = 'playing';
    currentLevel = 1;
    score = 0;
    updateUI();
    generateLevel(currentLevel);
}

function restartGame() {
    document.getElementById('game-over-screen').classList.add('hidden');
    gameState = 'playing';
    score = Math.max(0, score - 50);
    updateUI();
    generateLevel(currentLevel);
}

function nextLevel() {
    document.getElementById('level-complete-screen').classList.add('hidden');
    currentLevel++;
    updateUI();
    generateLevel(currentLevel);
    gameState = 'playing';
}

function gameOver() {
    gameState = 'gameOver';
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function levelComplete() {
    gameState = 'levelComplete';
    score += currentLevel * 100;
    updateUI();
    document.getElementById('completed-level').textContent = currentLevel;
    document.getElementById('level-complete-screen').classList.remove('hidden');
}

function updateUI() {
    document.getElementById('level-num').textContent = currentLevel;
    document.getElementById('score').textContent = score;
}

// Game Loop
function gameLoop() {
    if (gameState === 'playing') {
        updatePhysics();
    }
    render();
    requestAnimationFrame(gameLoop);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
