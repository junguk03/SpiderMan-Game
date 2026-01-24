// ==================== GAME CONFIGURATION ====================
const CONFIG = {
    // Physics
    gravity: 0.6,
    friction: 0.85,
    airResistance: 0.99,

    // Player
    playerWidth: 20,
    playerHeight: 40,
    moveSpeed: 5,
    jumpForce: -12,
    wallSlideSpeed: 2,
    wallJumpForce: { x: 8, y: -10 },

    // Grappling
    ropeSpeed: 25,
    swingForce: 0.8,
    maxRopeLength: 300,

    // Game
    tileSize: 40
};

// ==================== GAME STATE ====================
let canvas, ctx;
let gameState = 'start'; // start, tutorial, playing, paused, levelComplete, gameOver
let currentLevel = 0; // 0 = tutorial
let totalStars = 0;
let collectedStars = 0;

// Input
const keys = {
    left: false,
    right: false,
    jump: false,
    grapple: false
};
let mouseX = 0, mouseY = 0;

// Player
let player = {
    x: 0, y: 0,
    vx: 0, vy: 0,
    width: CONFIG.playerWidth,
    height: CONFIG.playerHeight,
    onGround: false,
    onWall: 0, // -1: left wall, 0: none, 1: right wall
    wallJumpCooldown: 0,
    facingRight: true
};

// Grappling Hook
let grapple = {
    active: false,
    attached: false,
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    anchorX: 0, anchorY: 0,
    ropeLength: 0
};

// Level elements
let platforms = [];
let walls = [];
let anchors = [];
let stars = [];
let door = null;
let spawnPoint = { x: 0, y: 0 };

// Camera
let camera = { x: 0, y: 0 };

// Tutorial
let tutorialStep = 0;
let tutorialMessage = '';
let tutorialCompleted = {
    move: false,
    jump: false,
    wallJump: false,
    grapple: false,
    swing: false,
    star: false
};

// ==================== LEVELS DATA ====================
const LEVELS = [
    // Level 0: Tutorial
    {
        spawn: { x: 100, y: 360 },
        platforms: [
            { x: 0, y: 400, w: 300, h: 40 },
            { x: 400, y: 400, w: 200, h: 40 },
            { x: 700, y: 350, w: 150, h: 40 },
            { x: 950, y: 300, w: 200, h: 40 },
            { x: 1250, y: 400, w: 300, h: 40 }
        ],
        walls: [
            { x: 950, y: 100, w: 20, h: 200 },
            { x: 1130, y: 100, w: 20, h: 200 }
        ],
        anchors: [
            { x: 500, y: 150 },
            { x: 650, y: 120 },
            { x: 850, y: 100 }
        ],
        stars: [
            { x: 500, y: 250 },
            { x: 1040, y: 150 }
        ],
        door: { x: 1450, y: 340 },
        tutorial: true
    },
    // Level 1: Easy - Just jumping
    {
        spawn: { x: 50, y: 360 },
        platforms: [
            { x: 0, y: 400, w: 150, h: 40 },
            { x: 200, y: 400, w: 100, h: 40 },
            { x: 350, y: 380, w: 100, h: 40 },
            { x: 500, y: 360, w: 100, h: 40 },
            { x: 650, y: 400, w: 200, h: 40 }
        ],
        walls: [],
        anchors: [],
        stars: [
            { x: 250, y: 350 },
            { x: 400, y: 320 }
        ],
        door: { x: 750, y: 340 }
    },
    // Level 2: Introduction to gaps
    {
        spawn: { x: 50, y: 360 },
        platforms: [
            { x: 0, y: 400, w: 150, h: 40 },
            { x: 250, y: 400, w: 100, h: 40 },
            { x: 450, y: 380, w: 100, h: 40 },
            { x: 650, y: 400, w: 150, h: 40 }
        ],
        walls: [],
        anchors: [
            { x: 350, y: 200 }
        ],
        stars: [
            { x: 300, y: 350 },
            { x: 350, y: 150 }
        ],
        door: { x: 700, y: 340 }
    },
    // Level 3: Wall jump intro
    {
        spawn: { x: 50, y: 460 },
        platforms: [
            { x: 0, y: 500, w: 200, h: 40 },
            { x: 300, y: 500, w: 100, h: 40 },
            { x: 300, y: 300, w: 200, h: 40 },
            { x: 600, y: 500, w: 200, h: 40 }
        ],
        walls: [
            { x: 300, y: 300, w: 20, h: 200 },
            { x: 480, y: 300, w: 20, h: 200 }
        ],
        anchors: [],
        stars: [
            { x: 390, y: 400 },
            { x: 390, y: 250 }
        ],
        door: { x: 700, y: 440 }
    },
    // Level 4: Grappling basics
    {
        spawn: { x: 50, y: 360 },
        platforms: [
            { x: 0, y: 400, w: 150, h: 40 },
            { x: 400, y: 400, w: 150, h: 40 },
            { x: 700, y: 400, w: 200, h: 40 }
        ],
        walls: [],
        anchors: [
            { x: 275, y: 150 },
            { x: 550, y: 150 }
        ],
        stars: [
            { x: 275, y: 250 },
            { x: 550, y: 250 }
        ],
        door: { x: 800, y: 340 }
    },
    // Level 5: Swing momentum
    {
        spawn: { x: 50, y: 360 },
        platforms: [
            { x: 0, y: 400, w: 100, h: 40 },
            { x: 500, y: 450, w: 150, h: 40 },
            { x: 800, y: 400, w: 200, h: 40 }
        ],
        walls: [],
        anchors: [
            { x: 250, y: 100 },
            { x: 450, y: 80 },
            { x: 650, y: 100 }
        ],
        stars: [
            { x: 250, y: 200 },
            { x: 650, y: 200 }
        ],
        door: { x: 900, y: 340 }
    }
];

// Generate more levels procedurally
function generateLevel(levelNum) {
    const difficulty = Math.min(levelNum / 20, 1); // 0 to 1
    const levelWidth = 800 + levelNum * 50;
    const platforms = [];
    const walls = [];
    const anchors = [];
    const stars = [];

    // Starting platform
    platforms.push({ x: 0, y: 400, w: 150, h: 40 });

    let lastX = 150;
    let lastY = 400;
    const segments = 3 + Math.floor(levelNum / 10);

    for (let i = 0; i < segments; i++) {
        const segmentType = Math.random();
        const gapSize = 100 + difficulty * 150 + Math.random() * 50;

        if (segmentType < 0.3 && difficulty > 0.2) {
            // Wall climb section
            const wallX = lastX + gapSize;
            const wallHeight = 150 + Math.random() * 100;
            walls.push({ x: wallX, y: lastY - wallHeight, w: 20, h: wallHeight });
            walls.push({ x: wallX + 100, y: lastY - wallHeight, w: 20, h: wallHeight });
            platforms.push({ x: wallX, y: lastY - wallHeight - 40, w: 120, h: 40 });
            stars.push({ x: wallX + 60, y: lastY - wallHeight / 2 });
            lastX = wallX + 120;
            lastY = lastY - wallHeight - 40;
        } else if (segmentType < 0.6 && difficulty > 0.1) {
            // Grapple section
            const platX = lastX + gapSize + 100;
            anchors.push({ x: lastX + gapSize / 2 + 50, y: lastY - 200 - Math.random() * 100 });
            stars.push({ x: lastX + gapSize / 2 + 50, y: lastY - 100 });
            platforms.push({ x: platX, y: lastY + (Math.random() - 0.5) * 60, w: 100 + Math.random() * 50, h: 40 });
            lastX = platX + 100;
        } else {
            // Simple jump section
            const platX = lastX + 80 + Math.random() * 40;
            const platY = lastY + (Math.random() - 0.5) * 40;
            platforms.push({ x: platX, y: platY, w: 80 + Math.random() * 60, h: 40 });
            if (Math.random() > 0.5) {
                stars.push({ x: platX + 50, y: platY - 60 });
            }
            lastX = platX + 100;
            lastY = platY;
        }
    }

    // Ending platform with door
    platforms.push({ x: lastX + 100, y: 400, w: 200, h: 40 });

    return {
        spawn: { x: 50, y: 360 },
        platforms,
        walls,
        anchors,
        stars,
        door: { x: lastX + 180, y: 340 }
    };
}

// Fill LEVELS array to 100
while (LEVELS.length < 100) {
    LEVELS.push(generateLevel(LEVELS.length));
}

// ==================== INITIALIZATION ====================
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
        if (e.code === 'Space') {
            keys.jump = true;
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
        if (e.code === 'Space') keys.jump = false;
    });

    // Mouse events
    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (canvas.width / rect.width) + camera.x;
        mouseY = (e.clientY - rect.top) * (canvas.height / rect.height) + camera.y;
    });

    document.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            if (e.target.tagName === 'BUTTON') return;
            keys.grapple = true;
            if (gameState === 'playing' || gameState === 'tutorial') {
                shootGrapple();
            }
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            keys.grapple = false;
            releaseGrapple();
        }
    });

    // Button events
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('retry-btn').addEventListener('click', restartLevel);
    document.getElementById('next-level-btn').addEventListener('click', nextLevel);

    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// ==================== GAME CONTROLS ====================
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    currentLevel = 0;
    loadLevel(currentLevel);
    gameState = 'tutorial';
}

function restartLevel() {
    document.getElementById('game-over-screen').classList.add('hidden');
    loadLevel(currentLevel);
    gameState = currentLevel === 0 ? 'tutorial' : 'playing';
}

function nextLevel() {
    document.getElementById('level-complete-screen').classList.add('hidden');
    currentLevel++;
    if (currentLevel >= LEVELS.length) {
        currentLevel = 0; // Loop back
    }
    loadLevel(currentLevel);
    gameState = 'playing';
}

function loadLevel(levelNum) {
    const level = LEVELS[levelNum];

    platforms = level.platforms.map(p => ({...p}));
    walls = level.walls.map(w => ({...w}));
    anchors = level.anchors.map(a => ({...a, radius: 15}));
    stars = level.stars.map(s => ({...s, collected: false, radius: 15}));
    door = { ...level.door, width: 50, height: 60, open: false };
    spawnPoint = { ...level.spawn };

    totalStars = stars.length;
    collectedStars = 0;

    resetPlayer();
    resetGrapple();

    if (level.tutorial) {
        tutorialStep = 0;
        gameState = 'tutorial';
    }

    updateUI();
}

function resetPlayer() {
    player.x = spawnPoint.x;
    player.y = spawnPoint.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.onWall = 0;
    player.facingRight = true;
}

function resetGrapple() {
    grapple.active = false;
    grapple.attached = false;
}

// ==================== GRAPPLING HOOK ====================
function shootGrapple() {
    if (grapple.attached) return;

    grapple.active = true;
    grapple.attached = false;
    grapple.x = player.x + player.width / 2;
    grapple.y = player.y;
    grapple.targetX = mouseX;
    grapple.targetY = mouseY;

    const dx = mouseX - grapple.x;
    const dy = mouseY - grapple.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    grapple.vx = (dx / dist) * CONFIG.ropeSpeed;
    grapple.vy = (dy / dist) * CONFIG.ropeSpeed;
}

function releaseGrapple() {
    if (grapple.attached) {
        // Add momentum from swing
        const swingBoost = 1.3;
        player.vx *= swingBoost;
        player.vy *= swingBoost;
    }
    grapple.active = false;
    grapple.attached = false;
}

function updateGrapple() {
    if (!grapple.active) return;

    if (!grapple.attached) {
        // Grapple is flying
        grapple.x += grapple.vx;
        grapple.y += grapple.vy;

        // Check distance limit
        const dx = grapple.x - (player.x + player.width / 2);
        const dy = grapple.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > CONFIG.maxRopeLength) {
            grapple.active = false;
            return;
        }

        // Check anchor collision
        for (const anchor of anchors) {
            const ax = grapple.x - anchor.x;
            const ay = grapple.y - anchor.y;
            if (Math.sqrt(ax * ax + ay * ay) < anchor.radius + 5) {
                grapple.attached = true;
                grapple.anchorX = anchor.x;
                grapple.anchorY = anchor.y;
                grapple.ropeLength = Math.sqrt(
                    Math.pow(player.x + player.width / 2 - anchor.x, 2) +
                    Math.pow(player.y - anchor.y, 2)
                );

                if (gameState === 'tutorial' && !tutorialCompleted.grapple) {
                    tutorialCompleted.grapple = true;
                }
                return;
            }
        }

        // Check wall/platform collision (grapple fails)
        for (const plat of platforms) {
            if (grapple.x > plat.x && grapple.x < plat.x + plat.w &&
                grapple.y > plat.y && grapple.y < plat.y + plat.h) {
                grapple.active = false;
                return;
            }
        }
    }
}

// ==================== PHYSICS UPDATE ====================
function updatePhysics() {
    // Horizontal movement
    if (!grapple.attached) {
        if (keys.left) {
            player.vx = -CONFIG.moveSpeed;
            player.facingRight = false;
        } else if (keys.right) {
            player.vx = CONFIG.moveSpeed;
            player.facingRight = true;
        } else {
            player.vx *= player.onGround ? CONFIG.friction : CONFIG.airResistance;
        }
    } else {
        // Swing physics with A/D
        const dx = player.x + player.width / 2 - grapple.anchorX;
        const dy = player.y - grapple.anchorY;
        const angle = Math.atan2(dy, dx);

        if (keys.left) {
            player.vx -= Math.cos(angle + Math.PI / 2) * CONFIG.swingForce;
            player.vy -= Math.sin(angle + Math.PI / 2) * CONFIG.swingForce;

            if (gameState === 'tutorial' && !tutorialCompleted.swing) {
                tutorialCompleted.swing = true;
            }
        }
        if (keys.right) {
            player.vx += Math.cos(angle + Math.PI / 2) * CONFIG.swingForce;
            player.vy += Math.sin(angle + Math.PI / 2) * CONFIG.swingForce;

            if (gameState === 'tutorial' && !tutorialCompleted.swing) {
                tutorialCompleted.swing = true;
            }
        }
    }

    // Gravity
    player.vy += CONFIG.gravity;

    // Wall sliding
    if (player.onWall !== 0 && player.vy > 0 && !player.onGround) {
        player.vy = Math.min(player.vy, CONFIG.wallSlideSpeed);
    }

    // Jumping
    if (keys.jump && player.wallJumpCooldown <= 0) {
        if (player.onGround) {
            player.vy = CONFIG.jumpForce;
            player.onGround = false;

            if (gameState === 'tutorial' && !tutorialCompleted.jump) {
                tutorialCompleted.jump = true;
            }
        } else if (player.onWall !== 0) {
            player.vx = CONFIG.wallJumpForce.x * -player.onWall;
            player.vy = CONFIG.wallJumpForce.y;
            player.wallJumpCooldown = 10;
            player.facingRight = player.onWall < 0;

            if (gameState === 'tutorial' && !tutorialCompleted.wallJump) {
                tutorialCompleted.wallJump = true;
            }
        }
        keys.jump = false; // Prevent holding
    }

    if (player.wallJumpCooldown > 0) player.wallJumpCooldown--;

    // Grapple constraint
    if (grapple.attached) {
        const dx = player.x + player.width / 2 - grapple.anchorX;
        const dy = player.y - grapple.anchorY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > grapple.ropeLength) {
            const angle = Math.atan2(dy, dx);
            player.x = grapple.anchorX + Math.cos(angle) * grapple.ropeLength - player.width / 2;
            player.y = grapple.anchorY + Math.sin(angle) * grapple.ropeLength;

            // Constrain velocity to tangent
            const dot = player.vx * Math.cos(angle) + player.vy * Math.sin(angle);
            if (dot > 0) {
                player.vx -= dot * Math.cos(angle);
                player.vy -= dot * Math.sin(angle);
            }
        }
    }

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Tutorial movement check
    if (gameState === 'tutorial' && !tutorialCompleted.move) {
        if (Math.abs(player.vx) > 1) {
            tutorialCompleted.move = true;
        }
    }

    // Collision detection
    checkCollisions();

    // Update camera
    updateCamera();

    // Check death (falling)
    if (player.y > 600) {
        gameOver();
    }

    // Check star collection
    checkStars();

    // Check door
    checkDoor();

    // Update grapple
    updateGrapple();
}

function checkCollisions() {
    player.onGround = false;
    player.onWall = 0;

    // Platform collisions
    for (const plat of platforms) {
        if (player.x + player.width > plat.x && player.x < plat.x + plat.w) {
            // Top collision (landing)
            if (player.vy > 0 &&
                player.y + player.height > plat.y &&
                player.y + player.height < plat.y + plat.h + player.vy + 1) {
                player.y = plat.y - player.height;
                player.vy = 0;
                player.onGround = true;
            }
            // Bottom collision
            else if (player.vy < 0 &&
                player.y < plat.y + plat.h &&
                player.y > plat.y) {
                player.y = plat.y + plat.h;
                player.vy = 0;
            }
        }
    }

    // Wall collisions
    for (const wall of walls) {
        // Left side of wall
        if (player.x + player.width > wall.x &&
            player.x + player.width < wall.x + wall.w + Math.abs(player.vx) + 1 &&
            player.y + player.height > wall.y &&
            player.y < wall.y + wall.h) {
            player.x = wall.x - player.width;
            player.vx = 0;
            player.onWall = 1;
        }
        // Right side of wall
        else if (player.x < wall.x + wall.w &&
            player.x > wall.x - Math.abs(player.vx) - 1 &&
            player.y + player.height > wall.y &&
            player.y < wall.y + wall.h) {
            player.x = wall.x + wall.w;
            player.vx = 0;
            player.onWall = -1;
        }
    }
}

function checkStars() {
    for (const star of stars) {
        if (star.collected) continue;

        const dx = (player.x + player.width / 2) - star.x;
        const dy = (player.y + player.height / 2) - star.y;

        if (Math.sqrt(dx * dx + dy * dy) < star.radius + 20) {
            star.collected = true;
            collectedStars++;

            if (gameState === 'tutorial' && !tutorialCompleted.star) {
                tutorialCompleted.star = true;
            }

            if (collectedStars >= totalStars) {
                door.open = true;
            }

            updateUI();
        }
    }
}

function checkDoor() {
    if (!door.open) return;

    const dx = (player.x + player.width / 2) - (door.x + door.width / 2);
    const dy = (player.y + player.height / 2) - (door.y + door.height / 2);

    if (Math.abs(dx) < 30 && Math.abs(dy) < 40) {
        levelComplete();
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 3;
    const targetY = player.y - canvas.height / 2;

    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    camera.x = Math.max(0, camera.x);
    camera.y = Math.max(-100, Math.min(200, camera.y));
}

// ==================== RENDERING ====================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw platforms
    for (const plat of platforms) {
        drawPlatform(plat);
    }

    // Draw walls
    for (const wall of walls) {
        drawWall(wall);
    }

    // Draw anchors
    for (const anchor of anchors) {
        drawAnchor(anchor);
    }

    // Draw stars
    for (const star of stars) {
        if (!star.collected) {
            drawStar(star);
        }
    }

    // Draw door
    drawDoor();

    // Draw grapple
    if (grapple.active) {
        drawGrapple();
    }

    // Draw player
    drawPlayer();

    ctx.restore();

    // Draw tutorial overlay
    if (gameState === 'tutorial') {
        drawTutorial();
    }
}

function drawPlatform(plat) {
    ctx.fillStyle = '#4a4a6a';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

    // Top highlight
    ctx.fillStyle = '#6a6a8a';
    ctx.fillRect(plat.x, plat.y, plat.w, 5);
}

function drawWall(wall) {
    ctx.fillStyle = '#5a5a7a';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

    // Brick pattern
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 1;
    for (let y = wall.y; y < wall.y + wall.h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(wall.x, y);
        ctx.lineTo(wall.x + wall.w, y);
        ctx.stroke();
    }
}

function drawAnchor(anchor) {
    // Glow
    const gradient = ctx.createRadialGradient(
        anchor.x, anchor.y, 0,
        anchor.x, anchor.y, anchor.radius * 2
    );
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.6)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, anchor.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Main circle
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, anchor.radius, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(anchor.x - 4, anchor.y - 4, anchor.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawStar(star) {
    ctx.save();
    ctx.translate(star.x, star.y);

    // Glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;

    // Star shape
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? star.radius : star.radius * 0.5;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawDoor() {
    // Door frame
    ctx.fillStyle = door.open ? '#2ecc71' : '#7f8c8d';
    ctx.fillRect(door.x, door.y, door.width, door.height);

    // Door detail
    ctx.fillStyle = door.open ? '#27ae60' : '#6c7a7d';
    ctx.fillRect(door.x + 5, door.y + 5, door.width - 10, door.height - 10);

    // Handle
    ctx.fillStyle = door.open ? '#ffd700' : '#95a5a6';
    ctx.beginPath();
    ctx.arc(door.x + door.width - 12, door.y + door.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    if (door.open) {
        // Glow effect
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x - 2, door.y - 2, door.width + 4, door.height + 4);
        ctx.shadowBlur = 0;
    }
}

function drawGrapple() {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + 5;

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (grapple.attached) {
        ctx.beginPath();
        ctx.moveTo(playerCenterX, playerCenterY);
        ctx.lineTo(grapple.anchorX, grapple.anchorY);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(playerCenterX, playerCenterY);
        ctx.lineTo(grapple.x, grapple.y);
        ctx.stroke();

        // Hook
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(grapple.x, grapple.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlayer() {
    const x = player.x + player.width / 2;
    const y = player.y + player.height / 2;

    ctx.save();
    ctx.translate(x, y);
    if (!player.facingRight) ctx.scale(-1, 1);

    // Stickman
    ctx.strokeStyle = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;

    const headRadius = 8;
    const bodyLength = 18;
    const limbLength = 14;

    // Animation based on state
    let armAngle = 0.5;
    let legAngle = 0.3;

    if (grapple.attached) {
        // Arms reaching up
        armAngle = -0.8;
    } else if (!player.onGround) {
        // Jumping pose
        armAngle = 0.8;
        legAngle = 0.5;
    } else if (Math.abs(player.vx) > 1) {
        // Running animation
        const runPhase = Date.now() * 0.015;
        armAngle = Math.sin(runPhase) * 0.5;
        legAngle = Math.sin(runPhase) * 0.4;
    }

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
    ctx.moveTo(0, -bodyLength + 3);
    ctx.lineTo(limbLength * Math.cos(armAngle), -bodyLength + 3 + limbLength * Math.sin(armAngle));
    ctx.moveTo(0, -bodyLength + 3);
    ctx.lineTo(limbLength * Math.cos(-armAngle + 0.2), -bodyLength + 3 + limbLength * Math.sin(-armAngle + 0.2));
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(limbLength * Math.cos(0.3 + legAngle), limbLength * Math.sin(0.3 + legAngle) + 3);
    ctx.moveTo(0, 0);
    ctx.lineTo(limbLength * Math.cos(0.3 - legAngle), limbLength * Math.sin(0.3 - legAngle) + 3);
    ctx.stroke();

    ctx.restore();
}

function drawTutorial() {
    const messages = [
        { condition: !tutorialCompleted.move, text: 'A, D 키로 좌우 이동', highlight: 'move' },
        { condition: tutorialCompleted.move && !tutorialCompleted.jump, text: 'Space로 점프!', highlight: 'jump' },
        { condition: tutorialCompleted.jump && !tutorialCompleted.grapple, text: '파란 공을 향해 마우스 클릭으로 줄 발사!', highlight: 'grapple' },
        { condition: tutorialCompleted.grapple && !tutorialCompleted.swing, text: '줄에 매달린 상태에서 A, D로 흔들어 관성 얻기!', highlight: 'swing' },
        { condition: tutorialCompleted.swing && !tutorialCompleted.star, text: '별을 모두 모으면 문이 열려요!', highlight: 'star' },
        { condition: tutorialCompleted.star && collectedStars < totalStars, text: '남은 별을 모두 모으세요!', highlight: 'star' },
        { condition: collectedStars >= totalStars, text: '초록색 문으로 들어가세요!', highlight: 'door' }
    ];

    const current = messages.find(m => m.condition);
    if (current) {
        // Background box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 200, 20, 400, 50);

        // Border
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 200, 20, 400, 50);

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '18px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(current.text, canvas.width / 2, 52);
    }
}

// ==================== GAME STATE ====================
function gameOver() {
    gameState = 'gameOver';
    document.getElementById('final-score').textContent = `Level ${currentLevel}`;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function levelComplete() {
    gameState = 'levelComplete';
    document.getElementById('completed-level').textContent = currentLevel === 0 ? 'Tutorial' : currentLevel;
    document.getElementById('level-complete-screen').classList.remove('hidden');
}

function updateUI() {
    document.getElementById('level-num').textContent = currentLevel === 0 ? 'Tutorial' : currentLevel;
    document.getElementById('score').textContent = `${collectedStars}/${totalStars}`;
}

// ==================== GAME LOOP ====================
function gameLoop() {
    if (gameState === 'playing' || gameState === 'tutorial') {
        updatePhysics();
    }
    render();
    requestAnimationFrame(gameLoop);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
