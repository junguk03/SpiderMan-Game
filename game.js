// ==================== GAME CONFIGURATION ====================
const CONFIG = {
    gravity: 0.5,
    friction: 0.85,
    airResistance: 0.99,
    playerWidth: 20,
    playerHeight: 40,
    moveSpeed: 5,
    jumpForce: -13,
    wallSlideSpeed: 2,
    wallJumpForce: { x: 10, y: -11 },
    ropeSpeed: 30,
    swingForce: 0.35,
    swingDamping: 0.98,
    maxRopeLength: 350
};

// ==================== GAME STATE ====================
let canvas, ctx;
let gameState = 'start';
let currentLevel = 0;
let totalStars = 0;
let collectedStars = 0;

const keys = { left: false, right: false, jump: false, grapple: false };
let mouseX = 0, mouseY = 0;

let player = {
    x: 0, y: 0, vx: 0, vy: 0,
    width: CONFIG.playerWidth,
    height: CONFIG.playerHeight,
    onGround: false,
    onWall: 0,
    wallJumpCooldown: 0,
    facingRight: true
};

let grapple = {
    active: false, attached: false,
    x: 0, y: 0, vx: 0, vy: 0,
    anchorX: 0, anchorY: 0,
    ropeLength: 0
};

let platforms = [], walls = [], anchors = [], stars = [];
let buttons = []; // 버튼 배열 추가
let door = null;
let spawnPoint = { x: 0, y: 0 };
let camera = { x: 0, y: 0 };

// Tutorial state
let tutorialStep = 0;
let tutorialActions = {
    moved: false, jumped: false, wallJumped: false,
    grappled: false, swung: false, collected: false
};

// ==================== LEVELS ====================
function createLevels() {
    const levels = [];

    // Tutorial Level (Level 0)
    levels.push({
        name: 'Tutorial',
        spawn: { x: 80, y: 300 },
        platforms: [
            { x: 0, y: 350, w: 250, h: 30 },
            { x: 350, y: 350, w: 200, h: 30 },
            { x: 650, y: 320, w: 150, h: 30 },
            { x: 900, y: 280, w: 200, h: 30 },
            { x: 1200, y: 350, w: 250, h: 30 }
        ],
        walls: [
            { x: 900, y: 100, w: 20, h: 180 },
            { x: 1080, y: 100, w: 20, h: 180 }
        ],
        anchors: [
            { x: 450, y: 150 },
            { x: 600, y: 120 },
            { x: 800, y: 100 }
        ],
        stars: [
            { x: 450, y: 220 },
            { x: 990, y: 150 }
        ],
        door: { x: 1350, y: 290 },
        isTutorial: true
    });

    // Level 1-5: Hand-crafted easy levels
    levels.push({
        name: 'Level 1',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 150, h: 30 },
            { x: 200, y: 370, w: 120, h: 30 },
            { x: 370, y: 350, w: 120, h: 30 },
            { x: 540, y: 370, w: 200, h: 30 }
        ],
        walls: [],
        anchors: [],
        stars: [{ x: 260, y: 320 }, { x: 430, y: 300 }],
        door: { x: 650, y: 310 }
    });

    levels.push({
        name: 'Level 2',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 150, h: 30 },
            { x: 280, y: 370, w: 120, h: 30 },
            { x: 500, y: 350, w: 150, h: 30 }
        ],
        walls: [],
        anchors: [{ x: 350, y: 180 }],
        stars: [{ x: 350, y: 250 }, { x: 350, y: 130 }],
        door: { x: 560, y: 290 }
    });

    levels.push({
        name: 'Level 3',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 150, h: 30 },
            { x: 400, y: 370, w: 150, h: 30 },
            { x: 650, y: 370, w: 150, h: 30 }
        ],
        walls: [],
        anchors: [{ x: 270, y: 150 }, { x: 520, y: 150 }],
        stars: [{ x: 270, y: 250 }, { x: 520, y: 250 }],
        door: { x: 720, y: 310 }
    });

    levels.push({
        name: 'Level 4',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 120, h: 30 },
            { x: 350, y: 400, w: 150, h: 30 },
            { x: 650, y: 370, w: 200, h: 30 }
        ],
        walls: [],
        anchors: [{ x: 230, y: 150 }, { x: 500, y: 130 }],
        stars: [{ x: 230, y: 230 }, { x: 500, y: 230 }],
        door: { x: 750, y: 310 }
    });

    levels.push({
        name: 'Level 5',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },
            { x: 500, y: 420, w: 120, h: 30 },
            { x: 750, y: 370, w: 200, h: 30 }
        ],
        walls: [],
        anchors: [{ x: 200, y: 100 }, { x: 400, y: 80 }, { x: 600, y: 100 }],
        stars: [{ x: 300, y: 180 }, { x: 500, y: 160 }],
        door: { x: 850, y: 310 }
    });

    // Level 6 - 첫 스윙 레벨
    levels.push({
        name: 'Level 6',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작
            { x: 400, y: 370, w: 100, h: 30 },         // 중간
            { x: 800, y: 370, w: 150, h: 30 }          // 도착
        ],
        walls: [],
        anchors: [{ x: 250, y: 120 }, { x: 600, y: 100 }],
        stars: [{ x: 250, y: 200 }, { x: 600, y: 180 }],
        door: { x: 880, y: 310 }
    });

    // Level 7 - 벽타기 소개
    levels.push({
        name: 'Level 7',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작
            { x: 500, y: 370, w: 100, h: 30 },         // 중간
            { x: 950, y: 370, w: 150, h: 30 }          // 도착
        ],
        walls: [
            { x: 200, y: 180, w: 20, h: 190 },
            { x: 280, y: 180, w: 20, h: 190 }
        ],
        anchors: [{ x: 400, y: 100 }, { x: 720, y: 80 }],
        stars: [{ x: 240, y: 260 }, { x: 550, y: 150 }, { x: 720, y: 130 }],
        door: { x: 1030, y: 310 }
    });

    // Level 8 - 연속 스윙
    levels.push({
        name: 'Level 8',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작
            { x: 500, y: 370, w: 80, h: 30 },          // 중간
            { x: 1000, y: 370, w: 150, h: 30 }         // 도착
        ],
        walls: [],
        anchors: [{ x: 250, y: 80 }, { x: 500, y: 60 }, { x: 750, y: 80 }],
        stars: [{ x: 350, y: 130 }, { x: 620, y: 110 }, { x: 880, y: 130 }],
        door: { x: 1080, y: 310 }
    });

    // Level 9 - 벽 + 스윙 조합
    levels.push({
        name: 'Level 9',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작
            { x: 500, y: 370, w: 80, h: 30 },          // 중간
            { x: 1000, y: 370, w: 150, h: 30 }         // 도착
        ],
        walls: [
            { x: 700, y: 150, w: 20, h: 220 },
            { x: 780, y: 150, w: 20, h: 220 }
        ],
        anchors: [{ x: 250, y: 100 }, { x: 500, y: 80 }, { x: 900, y: 100 }],
        stars: [{ x: 350, y: 150 }, { x: 740, y: 230 }, { x: 900, y: 150 }],
        door: { x: 1080, y: 310 }
    });

    // Level 10 - 버튼 시스템 도입!
    levels.push({
        name: 'Level 10',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작 (버튼1)
            { x: 500, y: 370, w: 100, h: 30 },         // 중간
            { x: 1000, y: 370, w: 100, h: 30 },        // 버튼2
            { x: 1400, y: 370, w: 150, h: 30 }         // 도착
        ],
        walls: [],
        anchors: [
            { x: 250, y: 80 },
            { x: 500, y: 60 },
            { x: 750, y: 80 },
            { x: 1200, y: 80 }
        ],
        stars: [
            { x: 350, y: 120, active: false, buttonId: 0 },  // 버튼1로 활성화
            { x: 850, y: 100, active: false, buttonId: 1 }   // 버튼2로 활성화
        ],
        buttons: [
            { x: 30, y: 355, targetStarIndex: 0 },     // 시작 플랫폼 버튼
            { x: 1030, y: 355, targetStarIndex: 1 }    // 버튼2 플랫폼
        ],
        door: { x: 1470, y: 310 },
        isButtonLevel: true,
        tutorial: '버튼을 밟아 별을 활성화하세요!'
    });

    // Level 11 - 벽타기 + 스윙 조합
    levels.push({
        name: 'Level 11',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작
            { x: 450, y: 370, w: 100, h: 30 },         // 중간 (넓은 간격)
            { x: 900, y: 370, w: 150, h: 30 }          // 도착
        ],
        walls: [
            { x: 200, y: 180, w: 20, h: 190 },         // 벽타기용 벽 1
            { x: 280, y: 180, w: 20, h: 190 }          // 벽타기용 벽 2
        ],
        anchors: [
            { x: 350, y: 100 },
            { x: 650, y: 80 },
            { x: 800, y: 100 }
        ],
        stars: [
            { x: 240, y: 250 },   // 벽 사이 별
            { x: 550, y: 150 },   // 스윙 별 1
            { x: 750, y: 130 }    // 스윙 별 2
        ],
        door: { x: 980, y: 310 }
    });

    // Level 12 - 연속 스윙 레벨
    levels.push({
        name: 'Level 12',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작
            { x: 550, y: 370, w: 80, h: 30 },          // 중간 착지
            { x: 1100, y: 370, w: 150, h: 30 }         // 도착
        ],
        walls: [],
        anchors: [
            { x: 200, y: 80 },
            { x: 400, y: 60 },
            { x: 650, y: 60 },
            { x: 900, y: 80 }
        ],
        stars: [
            { x: 300, y: 130 },   // 높은 별 1
            { x: 520, y: 100 },   // 높은 별 2
            { x: 780, y: 120 }    // 높은 별 3
        ],
        door: { x: 1170, y: 310 }
    });

    // Level 13 - 높은 스윙 레벨 (왔다갔다 하며 별 수집)
    levels.push({
        name: 'Level 13',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작
            { x: 500, y: 370, w: 100, h: 30 },         // 중간 착지
            { x: 1000, y: 370, w: 150, h: 30 }         // 도착
        ],
        walls: [],  // 벽 없음 - 순수 스윙 레벨
        anchors: [
            { x: 200, y: 50 },    // 첫 번째 앵커 (높이)
            { x: 450, y: 30 },    // 두 번째 앵커 (더 높이)
            { x: 700, y: 30 },    // 세 번째 앵커
            { x: 950, y: 50 }     // 네 번째 앵커
        ],
        stars: [
            { x: 300, y: 100 },   // 높은 곳 별 1
            { x: 550, y: 80 },    // 높은 곳 별 2
            { x: 800, y: 100 }    // 높은 곳 별 3
        ],
        door: { x: 1070, y: 310 }
    });

    // Level 14 - 버튼 2개 + 스윙 조합
    levels.push({
        name: 'Level 14',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작 (버튼1)
            { x: 500, y: 370, w: 100, h: 30 },         // 중간
            { x: 1000, y: 370, w: 100, h: 30 },        // 버튼2
            { x: 1400, y: 370, w: 150, h: 30 }         // 도착
        ],
        walls: [],
        anchors: [
            { x: 250, y: 80 },
            { x: 500, y: 60 },
            { x: 750, y: 80 },
            { x: 1200, y: 80 }
        ],
        stars: [
            { x: 380, y: 120, active: false, buttonId: 0 },  // 버튼1로 활성화
            { x: 900, y: 100, active: false, buttonId: 1 },  // 버튼2로 활성화
            { x: 1200, y: 120 }                              // 일반 별
        ],
        buttons: [
            { x: 30, y: 355, targetStarIndex: 0 },     // 시작 플랫폼 버튼
            { x: 1030, y: 355, targetStarIndex: 1 }    // 버튼2 플랫폼
        ],
        door: { x: 1470, y: 310 },
        isButtonLevel: true
    });

    // Level 15 - 최종 도전 (벽타기 + 스윙 종합)
    levels.push({
        name: 'Level 15',
        spawn: { x: 50, y: 320 },
        platforms: [
            { x: 0, y: 370, w: 100, h: 30 },           // 시작
            { x: 500, y: 370, w: 80, h: 30 },          // 중간 1
            { x: 1000, y: 370, w: 80, h: 30 },         // 중간 2
            { x: 1500, y: 370, w: 150, h: 30 }         // 도착
        ],
        walls: [
            { x: 200, y: 150, w: 20, h: 220 },         // 벽 1
            { x: 280, y: 150, w: 20, h: 220 },         // 벽 2
            { x: 700, y: 100, w: 20, h: 270 },         // 벽 3
            { x: 780, y: 100, w: 20, h: 270 }          // 벽 4
        ],
        anchors: [
            { x: 400, y: 50 },
            { x: 600, y: 30 },
            { x: 900, y: 50 },
            { x: 1200, y: 30 },
            { x: 1400, y: 50 }
        ],
        stars: [
            { x: 240, y: 220 },   // 벽 사이 별 1
            { x: 500, y: 80 },    // 스윙 별 1
            { x: 740, y: 180 },   // 벽 사이 별 2
            { x: 1100, y: 60 }    // 스윙 별 2
        ],
        door: { x: 1570, y: 310 }
    });

    // Generate levels 16-100 (여전히 랜덤이지만 최소 1개 이상의 별 보장)
    for (let i = 16; i <= 100; i++) {
        levels.push(generateLevel(i));
    }

    return levels;
}

function generateLevel(num) {
    const difficulty = Math.min((num - 5) / 50, 1);
    const platforms = [];
    const walls = [];
    const anchors = [];
    const stars = [];

    platforms.push({ x: 0, y: 370, w: 120, h: 30 });

    let lastX = 120;
    let lastY = 370;
    const segments = 3 + Math.floor(num / 15);

    for (let i = 0; i < segments; i++) {
        const type = Math.random();
        const gap = 120 + difficulty * 100 + Math.random() * 80;

        if (type < 0.3 && difficulty > 0.15) {
            // Wall section
            const wx = lastX + gap;
            const wh = 120 + Math.random() * 80;
            walls.push({ x: wx, y: lastY - wh, w: 20, h: wh });
            walls.push({ x: wx + 80, y: lastY - wh, w: 20, h: wh });
            platforms.push({ x: wx, y: lastY - wh - 30, w: 100, h: 30 });
            stars.push({ x: wx + 50, y: lastY - wh / 2 });
            lastX = wx + 100;
            lastY = lastY - wh - 30;
        } else if (type < 0.6 && difficulty > 0.1) {
            // Grapple section
            const px = lastX + gap + 80;
            anchors.push({ x: lastX + gap / 2 + 40, y: lastY - 180 - Math.random() * 80 });
            stars.push({ x: lastX + gap / 2 + 40, y: lastY - 80 });
            const newY = lastY + (Math.random() - 0.5) * 50;
            platforms.push({ x: px, y: newY, w: 100 + Math.random() * 40, h: 30 });
            lastX = px + 100;
            lastY = newY;
        } else {
            // Jump section
            const px = lastX + 70 + Math.random() * 50;
            const py = lastY + (Math.random() - 0.5) * 30;
            platforms.push({ x: px, y: py, w: 80 + Math.random() * 50, h: 30 });
            if (Math.random() > 0.4) {
                stars.push({ x: px + 50, y: py - 50 });
            }
            lastX = px + 100;
            lastY = py;
        }
    }

    platforms.push({ x: lastX + 80, y: 370, w: 180, h: 30 });

    // 별이 없으면 최소 1개 추가
    if (stars.length === 0) {
        const midPlatform = platforms[Math.floor(platforms.length / 2)];
        stars.push({ x: midPlatform.x + midPlatform.w / 2, y: midPlatform.y - 50 });
    }

    return {
        name: `Level ${num}`,
        spawn: { x: 50, y: 320 },
        platforms, walls, anchors, stars,
        door: { x: lastX + 150, y: 310 }
    };
}

const LEVELS = createLevels();

// ==================== INITIALIZATION ====================
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
        if (e.code === 'Space') { keys.jump = true; e.preventDefault(); }
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
        if (e.code === 'Space') keys.jump = false;
    });

    // Mouse
    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) / rect.width * canvas.width + camera.x;
        mouseY = (e.clientY - rect.top) / rect.height * canvas.height + camera.y;
    });
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && e.target.tagName !== 'BUTTON') {
            keys.grapple = true;
            if (gameState === 'playing') shootGrapple();
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) { keys.grapple = false; releaseGrapple(); }
    });

    // Touch
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouseX = (touch.clientX - rect.left) / rect.width * canvas.width + camera.x;
        mouseY = (touch.clientY - rect.top) / rect.height * canvas.height + camera.y;
        keys.grapple = true;
        if (gameState === 'playing') shootGrapple();
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.grapple = false;
        releaseGrapple();
    }, { passive: false });

    // Buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('retry-btn').addEventListener('click', restartLevel);
    document.getElementById('next-level-btn').addEventListener('click', nextLevel);

    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reload level if game is playing to adjust y positions
    if (gameState === 'playing' && LEVELS[currentLevel]) {
        loadLevel(currentLevel);
    }
}

// ==================== GAME CONTROLS ====================
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    currentLevel = 0;
    loadLevel(currentLevel);
    gameState = 'playing';
}

function restartLevel() {
    document.getElementById('game-over-screen').classList.add('hidden');
    loadLevel(currentLevel);
    gameState = 'playing';
}

function nextLevel() {
    document.getElementById('level-complete-screen').classList.add('hidden');
    currentLevel++;
    if (currentLevel >= LEVELS.length) currentLevel = 1;
    loadLevel(currentLevel);
    gameState = 'playing';
}

function loadLevel(num) {
    const level = LEVELS[num];

    // Calculate y offset to position level at bottom of screen
    const groundY = canvas.height - 150;
    const baseY = 370; // Original base y in level data
    const yOffset = groundY - baseY;

    platforms = level.platforms.map(p => ({ ...p, y: p.y + yOffset }));
    walls = level.walls.map(w => ({ ...w, y: w.y + yOffset }));
    anchors = level.anchors.map(a => ({ ...a, y: a.y + yOffset, radius: 18 }));
    stars = level.stars.map(s => ({
        ...s,
        y: s.y + yOffset,
        collected: false,
        radius: 18,
        active: s.active !== false // 기본값은 true, 명시적으로 false인 경우만 비활성화
    }));

    // 버튼 로드
    if (level.buttons) {
        buttons = level.buttons.map(b => ({
            ...b,
            y: b.y + yOffset,
            width: 40,
            height: 15,
            pressed: false
        }));
    } else {
        buttons = [];
    }

    door = { ...level.door, y: level.door.y + yOffset, width: 50, height: 70, open: false };
    spawnPoint = { x: level.spawn.x, y: level.spawn.y + yOffset };
    totalStars = stars.length;
    collectedStars = 0;

    if (level.isTutorial) {
        tutorialStep = 0;
        tutorialActions = { moved: false, jumped: false, wallJumped: false, grappled: false, swung: false, collected: false };
    }

    resetPlayer();
    grapple.active = false;
    grapple.attached = false;
    camera.x = 0;
    camera.y = 0;
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

// ==================== GRAPPLING ====================
function shootGrapple() {
    if (grapple.attached) return;
    grapple.active = true;
    grapple.attached = false;
    grapple.x = player.x + player.width / 2;
    grapple.y = player.y + 5;
    const dx = mouseX - grapple.x;
    const dy = mouseY - grapple.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) {
        grapple.active = false;
        return;
    }
    grapple.vx = (dx / dist) * CONFIG.ropeSpeed;
    grapple.vy = (dy / dist) * CONFIG.ropeSpeed;
}

function releaseGrapple() {
    if (grapple.attached) {
        // Gentle momentum boost on release
        player.vx *= 1.1;
        player.vy *= 1.1;
    }
    grapple.active = false;
    grapple.attached = false;
}

function updateGrapple() {
    if (!grapple.active) return;

    if (!grapple.attached) {
        grapple.x += grapple.vx;
        grapple.y += grapple.vy;

        const dx = grapple.x - (player.x + player.width / 2);
        const dy = grapple.y - (player.y + 5);
        if (Math.sqrt(dx * dx + dy * dy) > CONFIG.maxRopeLength) {
            grapple.active = false;
            return;
        }

        for (const anchor of anchors) {
            const ax = grapple.x - anchor.x;
            const ay = grapple.y - anchor.y;
            if (Math.sqrt(ax * ax + ay * ay) < anchor.radius + 8) {
                grapple.attached = true;
                grapple.anchorX = anchor.x;
                grapple.anchorY = anchor.y;
                grapple.ropeLength = Math.sqrt(
                    Math.pow(player.x + player.width / 2 - anchor.x, 2) +
                    Math.pow(player.y + 5 - anchor.y, 2)
                );
                tutorialActions.grappled = true;
                return;
            }
        }

        for (const plat of platforms) {
            if (grapple.x > plat.x && grapple.x < plat.x + plat.w &&
                grapple.y > plat.y && grapple.y < plat.y + plat.h) {
                grapple.active = false;
                return;
            }
        }
    }
}

// ==================== PHYSICS ====================
function updatePhysics() {
    // Movement
    if (!grapple.attached) {
        if (keys.left) {
            player.vx = -CONFIG.moveSpeed;
            player.facingRight = false;
            tutorialActions.moved = true;
        } else if (keys.right) {
            player.vx = CONFIG.moveSpeed;
            player.facingRight = true;
            tutorialActions.moved = true;
        } else {
            player.vx *= player.onGround ? CONFIG.friction : CONFIG.airResistance;
        }
    } else {
        // Swing (pendulum style)
        const dx = player.x + player.width / 2 - grapple.anchorX;
        const dy = player.y - grapple.anchorY;
        const angle = Math.atan2(dy, dx);

        // Apply swing force with damping (A=왼쪽, D=오른쪽)
        if (keys.left) {
            player.vx -= CONFIG.swingForce * 1.5;
            tutorialActions.swung = true;
        }
        if (keys.right) {
            player.vx += CONFIG.swingForce * 1.5;
            tutorialActions.swung = true;
        }

        // Apply damping for smoother swing
        player.vx *= CONFIG.swingDamping;
        player.vy *= CONFIG.swingDamping;
    }

    // Gravity
    player.vy += CONFIG.gravity;

    // Wall slide
    if (player.onWall !== 0 && player.vy > 0 && !player.onGround) {
        player.vy = Math.min(player.vy, CONFIG.wallSlideSpeed);
    }

    // Jump
    if (keys.jump && player.wallJumpCooldown <= 0) {
        if (player.onGround) {
            player.vy = CONFIG.jumpForce;
            player.onGround = false;
            tutorialActions.jumped = true;
        } else if (player.onWall !== 0) {
            player.vx = CONFIG.wallJumpForce.x * -player.onWall;
            player.vy = CONFIG.wallJumpForce.y;
            player.wallJumpCooldown = 10;
            player.facingRight = player.onWall < 0;
            tutorialActions.wallJumped = true;
        }
        keys.jump = false;
    }
    if (player.wallJumpCooldown > 0) player.wallJumpCooldown--;

    // Grapple constraint (pendulum - 180 degree limit)
    if (grapple.attached) {
        let dx = player.x + player.width / 2 - grapple.anchorX;
        let dy = player.y - grapple.anchorY;

        // Limit to 180 degrees (can't go above anchor)
        if (dy < 0) {
            player.y = grapple.anchorY;
            if (player.vy < 0) {
                // Convert upward velocity to horizontal (swing momentum)
                player.vx += (player.vy * -0.5) * Math.sign(dx);
                player.vy = 0;
            }
            dy = 0;
        }

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > grapple.ropeLength) {
            const angle = Math.atan2(dy, dx);
            player.x = grapple.anchorX + Math.cos(angle) * grapple.ropeLength - player.width / 2;
            player.y = grapple.anchorY + Math.sin(angle) * grapple.ropeLength;
            const dot = player.vx * Math.cos(angle) + player.vy * Math.sin(angle);
            if (dot > 0) {
                player.vx -= dot * Math.cos(angle);
                player.vy -= dot * Math.sin(angle);
            }
        }
    }

    player.x += player.vx;
    player.y += player.vy;

    checkCollisions();
    updateCamera();
    updateGrapple();

    // Death
    if (player.y > canvas.height + 100) gameOver();

    // Buttons - 버튼 충돌 감지 및 별 활성화
    for (const button of buttons) {
        if (button.pressed) continue;
        // 플레이어가 버튼 위에 있는지 확인 (더 넓은 범위로 감지)
        const playerCenterX = player.x + player.width / 2;
        const buttonCenterX = button.x + button.width / 2;
        const horizontalOverlap = Math.abs(playerCenterX - buttonCenterX) < (player.width / 2 + button.width / 2);
        const verticalNear = player.y + player.height >= button.y - 5 &&
                            player.y + player.height <= button.y + button.height + 20;

        if (horizontalOverlap && verticalNear && player.onGround) {
            button.pressed = true;
            // 연결된 별 활성화
            if (button.targetStarIndex !== undefined && stars[button.targetStarIndex]) {
                stars[button.targetStarIndex].active = true;
            }
        }
    }

    // Stars - active 상태인 별만 수집 가능
    for (const star of stars) {
        if (star.collected) continue;
        if (!star.active) continue; // 비활성화된 별은 수집 불가
        const dx = (player.x + player.width / 2) - star.x;
        const dy = (player.y + player.height / 2) - star.y;
        if (Math.sqrt(dx * dx + dy * dy) < star.radius + 20) {
            star.collected = true;
            collectedStars++;
            tutorialActions.collected = true;
            if (collectedStars >= totalStars) door.open = true;
            updateUI();
        }
    }

    // Door
    if (door.open) {
        const dx = (player.x + player.width / 2) - (door.x + door.width / 2);
        const dy = (player.y + player.height / 2) - (door.y + door.height / 2);
        if (Math.abs(dx) < 30 && Math.abs(dy) < 40) levelComplete();
    }
}

function checkCollisions() {
    player.onGround = false;
    player.onWall = 0;

    // 플랫폼 충돌 (위에서 착지 + 아래에서 머리 부딪힘)
    for (const plat of platforms) {
        if (player.x + player.width > plat.x && player.x < plat.x + plat.w) {
            // 위에서 착지 (기존)
            if (player.vy >= 0 && player.y + player.height > plat.y && player.y + player.height < plat.y + plat.h + 10) {
                player.y = plat.y - player.height;
                player.vy = 0;
                player.onGround = true;
                if (grapple.attached) {
                    grapple.active = false;
                    grapple.attached = false;
                }
            }
            // 아래에서 머리 부딪힘 (새로 추가)
            else if (player.vy < 0 && player.y < plat.y + plat.h && player.y > plat.y) {
                player.y = plat.y + plat.h;
                player.vy = 0;
            }
        }
    }

    // 벽 충돌 (좌우 + 상하)
    for (const wall of walls) {
        // 수평 충돌 (좌우)
        if (player.y + player.height > wall.y && player.y < wall.y + wall.h) {
            // 오른쪽에서 벽 왼쪽에 부딪힘
            if (player.x + player.width > wall.x && player.x + player.width < wall.x + wall.w / 2 + 10) {
                player.x = wall.x - player.width;
                player.vx = 0;
                player.onWall = 1;
                if (grapple.attached) {
                    const newDist = Math.sqrt(
                        Math.pow(player.x + player.width / 2 - grapple.anchorX, 2) +
                        Math.pow(player.y - grapple.anchorY, 2)
                    );
                    grapple.ropeLength = Math.min(grapple.ropeLength, newDist);
                }
            }
            // 왼쪽에서 벽 오른쪽에 부딪힘
            else if (player.x < wall.x + wall.w && player.x > wall.x + wall.w / 2 - 10) {
                player.x = wall.x + wall.w;
                player.vx = 0;
                player.onWall = -1;
                if (grapple.attached) {
                    const newDist = Math.sqrt(
                        Math.pow(player.x + player.width / 2 - grapple.anchorX, 2) +
                        Math.pow(player.y - grapple.anchorY, 2)
                    );
                    grapple.ropeLength = Math.min(grapple.ropeLength, newDist);
                }
            }
        }

        // 수직 충돌 (상하) - 벽 위/아래로 통과 방지
        if (player.x + player.width > wall.x && player.x < wall.x + wall.w) {
            // 아래에서 벽 바닥에 부딪힘
            if (player.vy < 0 && player.y < wall.y + wall.h && player.y > wall.y + wall.h - 20) {
                player.y = wall.y + wall.h;
                player.vy = 0;
            }
            // 위에서 벽 위에 착지
            else if (player.vy >= 0 && player.y + player.height > wall.y && player.y + player.height < wall.y + 20) {
                player.y = wall.y - player.height;
                player.vy = 0;
                player.onGround = true;
            }
        }
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 3;
    const targetY = player.y - canvas.height / 2;
    camera.x += (targetX - camera.x) * 0.08;
    camera.y += (targetY - camera.y) * 0.08;
    camera.x = Math.max(0, camera.x);
}

// ==================== RENDERING ====================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0f0c29');
    grad.addColorStop(0.5, '#302b63');
    grad.addColorStop(1, '#24243e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Only draw game elements when playing
    if (gameState !== 'playing') return;

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Platforms
    ctx.fillStyle = '#4a4a6a';
    for (const p of platforms) {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#6a6a8a';
        ctx.fillRect(p.x, p.y, p.w, 4);
        ctx.fillStyle = '#4a4a6a';
    }

    // Walls
    ctx.fillStyle = '#5a5a7a';
    for (const w of walls) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    // Anchors
    for (const a of anchors) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#667eea';
        ctx.fill();
    }

    // Buttons - 버튼 렌더링
    for (const btn of buttons) {
        ctx.save();
        if (btn.pressed) {
            // 눌린 버튼 - 납작하게
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(btn.x, btn.y + 10, btn.width, 5);
        } else {
            // 안 눌린 버튼 - 튀어나온 형태
            ctx.fillStyle = '#e74c3c';
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 10;
            ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
            // 버튼 위 하이라이트
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(btn.x + 2, btn.y + 2, btn.width - 4, 4);
        }
        ctx.restore();
    }

    // Stars - 활성화/비활성화 상태에 따라 다르게 렌더링
    for (const s of stars) {
        if (s.collected) continue;
        ctx.save();
        ctx.translate(s.x, s.y);

        // 별 모양 경로 생성
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? s.radius : s.radius * 0.4;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();

        if (s.active) {
            // 활성화된 별 - 채워진 금색
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.fill();
        } else {
            // 비활성화된 별 - 윤곽선만 (회색 투명)
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // 점선
            ctx.stroke();
            ctx.setLineDash([]); // 점선 해제
        }
        ctx.restore();
    }

    // Door
    if (door) {
        ctx.fillStyle = door.open ? '#2ecc71' : '#7f8c8d';
        ctx.fillRect(door.x, door.y, door.width, door.height);
        if (door.open) {
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 3;
            ctx.strokeRect(door.x, door.y, door.width, door.height);
            ctx.shadowBlur = 0;
        }
    }

    // Grapple
    if (grapple.active) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y + 5);
        ctx.lineTo(grapple.attached ? grapple.anchorX : grapple.x, grapple.attached ? grapple.anchorY : grapple.y);
        ctx.stroke();
    }

    // Player (stickman)
    drawPlayer();

    ctx.restore();

    // Tutorial overlay
    if (LEVELS[currentLevel]?.isTutorial) drawTutorial();

    // Button level tutorial - 버튼 레벨 안내
    if (LEVELS[currentLevel]?.isButtonLevel) drawButtonTutorial();
}

function drawPlayer() {
    const x = player.x + player.width / 2;
    const y = player.y + player.height / 2;

    ctx.save();
    ctx.translate(x, y);
    if (!player.facingRight) ctx.scale(-1, 1);

    ctx.strokeStyle = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;

    const head = 8, body = 18, limb = 14;
    let arm = 0.5, leg = 0.3;

    if (grapple.attached) arm = -0.8;
    else if (!player.onGround) { arm = 0.8; leg = 0.5; }
    else if (Math.abs(player.vx) > 1) {
        const t = Date.now() * 0.015;
        arm = Math.sin(t) * 0.5;
        leg = Math.sin(t) * 0.4;
    }

    ctx.beginPath();
    ctx.arc(0, -body - head, head, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -body);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -body + 3);
    ctx.lineTo(limb * Math.cos(arm), -body + 3 + limb * Math.sin(arm));
    ctx.moveTo(0, -body + 3);
    ctx.lineTo(limb * Math.cos(-arm + 0.2), -body + 3 + limb * Math.sin(-arm + 0.2));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(limb * Math.cos(0.3 + leg), limb * Math.sin(0.3 + leg) + 3);
    ctx.moveTo(0, 0);
    ctx.lineTo(limb * Math.cos(0.3 - leg), limb * Math.sin(0.3 - leg) + 3);
    ctx.stroke();

    ctx.restore();
}

function drawTutorial() {
    let msg = '';
    if (!tutorialActions.moved) msg = 'A / D 키로 좌우 이동';
    else if (!tutorialActions.jumped) msg = 'Space로 점프';
    else if (!tutorialActions.grappled) msg = '파란 공을 향해 마우스 클릭으로 줄 발사';
    else if (!tutorialActions.swung) msg = '매달린 상태에서 A / D로 흔들기';
    else if (!tutorialActions.collected) msg = '별을 모아 문을 열어요';
    else if (collectedStars < totalStars) msg = '남은 별을 모두 모으세요';
    else msg = '초록색 문으로 들어가세요!';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const w = 450, h = 50;
    ctx.fillRect(canvas.width / 2 - w / 2, 20, w, h);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - w / 2, 20, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(msg, canvas.width / 2, 52);
}

function drawButtonTutorial() {
    // 모든 버튼이 눌렸는지 확인
    const allButtonsPressed = buttons.every(b => b.pressed);
    // 모든 별이 활성화됐는지 확인
    const allStarsActive = stars.every(s => s.active);

    let msg = '';
    if (!allButtonsPressed) {
        msg = '🔴 빨간 버튼을 밟아 별을 활성화하세요!';
    } else if (!allStarsActive) {
        msg = '⭐ 별이 활성화되었습니다! 별을 모으세요!';
    } else if (collectedStars < totalStars) {
        msg = '⭐ 활성화된 별을 모두 모으세요!';
    } else {
        msg = '🚪 모든 별을 모았습니다! 문으로 이동하세요!';
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const w = 450, h = 50;
    ctx.fillRect(canvas.width / 2 - w / 2, 20, w, h);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - w / 2, 20, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(msg, canvas.width / 2, 52);
}

// ==================== GAME STATE ====================
function gameOver() {
    gameState = 'gameOver';
    document.getElementById('final-score').textContent = LEVELS[currentLevel]?.name || currentLevel;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function levelComplete() {
    gameState = 'levelComplete';
    document.getElementById('completed-level').textContent = LEVELS[currentLevel]?.name || currentLevel;
    document.getElementById('level-complete-screen').classList.remove('hidden');
}

function updateUI() {
    // 레벨 번호만 표시 (Tutorial은 0, 나머지는 1부터 시작하는 번호)
    const levelDisplay = currentLevel === 0 ? 'Tutorial' : currentLevel;
    document.getElementById('level-num').textContent = levelDisplay;
    document.getElementById('score').textContent = `${collectedStars}/${totalStars}`;
}

// ==================== GAME LOOP ====================
function gameLoop() {
    if (gameState === 'playing') updatePhysics();
    render();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', init);

// ==================== REFRESH WARNING ====================
// 게임 진행 중 새로고침 시 경고 메시지 표시
window.addEventListener('beforeunload', function(e) {
    // 게임이 시작 화면이 아닌 경우에만 경고 표시
    if (gameState === 'playing' || gameState === 'levelComplete') {
        e.preventDefault();
        // 표준 방식으로 경고 메시지 설정
        e.returnValue = '게임 진행 상황이 초기화됩니다. 정말 나가시겠습니까?';
        return e.returnValue;
    }
});
