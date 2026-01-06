const BG = '#101010';
const FG = '#50ff50';

const canvas = document.getElementById('game');
const updateCanvasSize = () => {
    const size = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = size;
    canvas.height = size;
};
updateCanvasSize();
const ctx = canvas.getContext('2d');

// Resize canvas on window resize
window.addEventListener('resize', updateCanvasSize);

// Create controls panel
const controlsPanel = document.createElement('div');
controlsPanel.style.cssText = 'position:fixed;bottom:20px;left:20px;background:rgba(0,0,0,0.8);padding:20px;border:2px solid #50ff50;border-radius:8px;min-width:300px;font-family:monospace;color:#50ff50;';
controlsPanel.innerHTML = `
    <h3 style="margin:0 0 15px 0;font-size:18px;">⚙️ Physics Controls</h3>
    <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;font-size:14px;">
            Jump Strength <span id="jumpStrengthValue" style="float:right;color:#0f0;">0.03</span>
        </label>
        <input type="range" id="jumpStrength" min="0.01" max="0.05" step="0.001" value="0.03" style="width:100%;accent-color:#50ff50;">
    </div>
    <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;font-size:14px;">
            Gravity <span id="gravityValue" style="float:right;color:#0f0;">0.0008</span>
        </label>
        <input type="range" id="gravity" min="0.0002" max="0.002" step="0.0001" value="0.0008" style="width:100%;accent-color:#50ff50;">
    </div>
    <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;font-size:14px;">
            Move Speed <span id="moveSpeedValue" style="float:right;color:#0f0;">3.0</span>
        </label>
        <input type="range" id="moveSpeed" min="1" max="6" step="0.1" value="3.0" style="width:100%;accent-color:#50ff50;">
    </div>
    <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;font-size:14px;">
            Jump Height <span id="jumpHeightValue" style="float:right;color:#0f0;">3.0</span>
        </label>
        <input type="range" id="jumpHeight" min="1" max="5" step="0.1" value="3.0" style="width:100%;accent-color:#50ff50;">
    </div>
`;
document.body.appendChild(controlsPanel);

const clear = () => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const fillPolygon = (points, color = FG) => {
    if (points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = BG;
    ctx.lineWidth = 1;
    ctx.stroke();
};

const screen = (p) => ({
    x: (p.x + 1) / 2 * canvas.width,
    y: (1 - (p.y + 1) / 2) * canvas.height,
});

const project = ({ x, y, z }) => {
    // Clip to near plane to prevent division issues
    const clippedZ = Math.max(z, 0.1);
    return {
        x: x / clippedZ,
        y: y / clippedZ,
    };
};

// Roblox character vertices
const robloxVs = [
    // Head (0-7) - small cube on top
    {x: -0.15, y: 0.35, z: 0.15}, {x: 0.15, y: 0.35, z: 0.15},
    {x: 0.15, y: 0.55, z: 0.15}, {x: -0.15, y: 0.55, z: 0.15},
    {x: -0.15, y: 0.35, z: -0.15}, {x: 0.15, y: 0.35, z: -0.15},
    {x: 0.15, y: 0.55, z: -0.15}, {x: -0.15, y: 0.55, z: -0.15},

    // Torso (8-15) - rectangular body
    {x: -0.2, y: 0, z: 0.1}, {x: 0.2, y: 0, z: 0.1},
    {x: 0.2, y: 0.35, z: 0.1}, {x: -0.2, y: 0.35, z: 0.1},
    {x: -0.2, y: 0, z: -0.1}, {x: 0.2, y: 0, z: -0.1},
    {x: 0.2, y: 0.35, z: -0.1}, {x: -0.2, y: 0.35, z: -0.1},

    // Left Arm (16-23)
    {x: -0.2, y: 0.1, z: 0.08}, {x: -0.3, y: 0.1, z: 0.08},
    {x: -0.3, y: 0.35, z: 0.08}, {x: -0.2, y: 0.35, z: 0.08},
    {x: -0.2, y: 0.1, z: -0.08}, {x: -0.3, y: 0.1, z: -0.08},
    {x: -0.3, y: 0.35, z: -0.08}, {x: -0.2, y: 0.35, z: -0.08},

    // Right Arm (24-31)
    {x: 0.2, y: 0.1, z: 0.08}, {x: 0.3, y: 0.1, z: 0.08},
    {x: 0.3, y: 0.35, z: 0.08}, {x: 0.2, y: 0.35, z: 0.08},
    {x: 0.2, y: 0.1, z: -0.08}, {x: 0.3, y: 0.1, z: -0.08},
    {x: 0.3, y: 0.35, z: -0.08}, {x: 0.2, y: 0.35, z: -0.08},

    // Left Leg (32-39)
    {x: -0.12, y: -0.35, z: 0.08}, {x: -0.02, y: -0.35, z: 0.08},
    {x: -0.02, y: 0, z: 0.08}, {x: -0.12, y: 0, z: 0.08},
    {x: -0.12, y: -0.35, z: -0.08}, {x: -0.02, y: -0.35, z: -0.08},
    {x: -0.02, y: 0, z: -0.08}, {x: -0.12, y: 0, z: -0.08},

    // Right Leg (40-47)
    {x: 0.02, y: -0.35, z: 0.08}, {x: 0.12, y: -0.35, z: 0.08},
    {x: 0.12, y: 0, z: 0.08}, {x: 0.02, y: 0, z: 0.08},
    {x: 0.02, y: -0.35, z: -0.08}, {x: 0.12, y: -0.35, z: -0.08},
    {x: 0.12, y: 0, z: -0.08}, {x: 0.02, y: 0, z: -0.08},
];

const robloxFs = [
    // Head faces
    [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0],
    // Torso faces
    [8, 9, 10, 11], [13, 12, 15, 14], [12, 8, 11, 15], [9, 13, 14, 10], [11, 10, 14, 15], [12, 13, 9, 8],
    // Left Arm faces
    [16, 17, 18, 19], [21, 20, 23, 22], [20, 16, 19, 23], [17, 21, 22, 18], [19, 18, 22, 23], [20, 21, 17, 16],
    // Right Arm faces
    [24, 25, 26, 27], [29, 28, 31, 30], [28, 24, 27, 31], [25, 29, 30, 26], [27, 26, 30, 31], [28, 29, 25, 24],
    // Left Leg faces
    [32, 33, 34, 35], [37, 36, 39, 38], [36, 32, 35, 39], [33, 37, 38, 34], [35, 34, 38, 39], [36, 37, 33, 32],
    // Right Leg faces
    [40, 41, 42, 43], [45, 44, 47, 46], [44, 40, 43, 47], [41, 45, 46, 42], [43, 42, 46, 47], [44, 45, 41, 40],
];

const translateZ = ({x, y, z}, dz) => ({
    x: x,
    y: y,
    z: z + dz,
});

const rotateYZ = ({x, y, z}, angle) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
        x: x,
        y: y * cosA - z * sinA,
        z: y * sinA + z * cosA,
    };
};

const rotateXZ = ({x, y, z}, angle) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
        x: x * cosA - z * sinA,
        y: y,
        z: x * sinA + z * cosA,
    };
};

const rotateAroundPoint = (v, pivot, rotateFunc, angle) => {
    // Translate to origin
    const translated = {
        x: v.x - pivot.x,
        y: v.y - pivot.y,
        z: v.z - pivot.z
    };
    // Rotate
    const rotated = rotateFunc(translated, angle);
    // Translate back
    return {
        x: rotated.x + pivot.x,
        y: rotated.y + pivot.y,
        z: rotated.z + pivot.z
    };
};

const FPS = 60;
let dz = 2.5;
let isWalking = false;
let legAngle = 0;
let rotationAngle = 0;
let verticalViewAngle = -0.3; // Look down at the character (negative for top-down view)
let keysPressed = {};
let isJumping = false;
let jumpVelocity = 0;
let yPosition = 0;
let isCrouching = false; // Track crouch state
let crouchHeight = 0; // How much player is crouched

// Physics parameters (controllable via sliders)
let JUMP_STRENGTH = 0.03;
let GRAVITY = 0.0008;
let JUMP_HEIGHT = 3.0;
let MOVE_SPEED = 3.0;

// Setup slider controls
const jumpStrengthSlider = document.getElementById('jumpStrength');
const gravitySlider = document.getElementById('gravity');
const moveSpeedSlider = document.getElementById('moveSpeed');
const jumpHeightSlider = document.getElementById('jumpHeight');

jumpStrengthSlider.addEventListener('input', (e) => {
    JUMP_STRENGTH = parseFloat(e.target.value);
    document.getElementById('jumpStrengthValue').textContent = JUMP_STRENGTH.toFixed(3);
});

gravitySlider.addEventListener('input', (e) => {
    GRAVITY = parseFloat(e.target.value);
    document.getElementById('gravityValue').textContent = GRAVITY.toFixed(4);
});

moveSpeedSlider.addEventListener('input', (e) => {
    MOVE_SPEED = parseFloat(e.target.value);
    document.getElementById('moveSpeedValue').textContent = MOVE_SPEED.toFixed(1);
});

jumpHeightSlider.addEventListener('input', (e) => {
    JUMP_HEIGHT = parseFloat(e.target.value);
    document.getElementById('jumpHeightValue').textContent = JUMP_HEIGHT.toFixed(1);
});

let collisionFlash = 0; // Timer for collision flash effect
let successFlash = 0; // Timer for success flash effect
let obstaclesUnderPlayer = new Set(); // Track obstacles currently beneath player
let scorePopups = []; // Active score popup animations [{value, x, y, lifetime}]
let projectiles = []; // Active projectiles [{x, y, z, vx, vy, vz, lifetime}]
let mouseX = 0; // Mouse X position for aiming
let mouseY = 0; // Mouse Y position for aiming

// World position
let worldX = 0;
let worldZ = 0;

// Scoring
let score = 0;
const COLLISION_PENALTY = 50;
const JUMP_SUCCESS_BONUS = 100;

// Game timer and statistics
let gameTimer = 0;
const GAME_DURATION = 30; // 30 seconds
let gameStarted = false;
let gameEnded = false;

// Statistics tracking
let stats = {
    stationaryObstaclesCleared: 0,
    stationaryObstaclesTotal: 0,
    movingWallsCleared: 0,
    movingWallsTotal: 0,
    flyingObstaclesDucked: 0,
    flyingObstaclesTotal: 0,
    targetsHit: 0,
    targetsTotal: 0,
    shotsFired: 0,
    shotsHit: 0
};

// Obstacle ID counter for tracking
let nextObstacleId = 0;

// Maze walls [{x, z, width, depth, height}]
let walls = [];
let movingWalls = []; // Obstacles that move towards player
let flyingObstacles = []; // Flying obstacles at head height
let targets = []; // Targets for shooting practice [{x, y, z, vx, vz, moveType}]
let lastGeneratedZ = 0;
const TRACK_WIDTH = 4;
const GENERATION_DISTANCE = 40; // Generate track this far ahead
const MOVING_WALL_SPEED = 2.0; // Speed at which moving walls approach
const FLYING_OBSTACLE_HEIGHT = 0.4; // Height at player's head level
const TARGET_MOVE_SPEED = 1.5; // Speed for moving targets

// Generate initial track
const generateTrackSection = (startZ, endZ) => {
    const newWalls = [];

    for (let z = startZ; z < endZ; z += 4) {
        // Side walls every segment
        newWalls.push(
            {x: -TRACK_WIDTH / 2, z: z, width: 0.3, depth: 3, height: 1.0},
            {x: TRACK_WIDTH / 2, z: z, width: 0.3, depth: 3, height: 1.0}
        );

        // Randomly add obstacles
        if (Math.random() > 0.85) {
            // Full-width jumpable obstacle (RED)
            newWalls.push({
                x: 0,
                z: z + 2,
                width: TRACK_WIDTH,
                depth: 0.3,
                height: 0.3,
                isStationary: true,
                tracked: false,
                color: '#f00', // Red
                id: nextObstacleId++
            });
        } else if (Math.random() > 0.7) {
            // Wall with gap
            const gapSide = Math.random() > 0.5 ? 1 : -1;
            newWalls.push({
                x: gapSide * (TRACK_WIDTH / 4),
                z: z + 2,
                width: TRACK_WIDTH / 2 - 0.5,
                depth: 0.3,
                height: 1.0
            });
        }

        // Moving obstacles (higher frequency)
        if (Math.random() > 0.8) {
            movingWalls.push({
                x: (Math.random() - 0.5) * (TRACK_WIDTH - 1),
                z: z + 10,
                width: 1.5,
                depth: 0.3,
                height: 0.4,
                tracked: false,
                isMoving: true,
                id: nextObstacleId++
            });
        }

        // Flying obstacles at head height
        if (Math.random() > 0.85) {
            flyingObstacles.push({
                x: 0,
                z: z + 12,
                width: TRACK_WIDTH,
                depth: 0.3,
                yMin: 0.55, // Higher up - above jump height
                yMax: 0.75,  // Higher up
                tracked: false,
                color: '#00f' // Blue
            });
        }

        // Targets
        if (Math.random() > 0.7) {
            const moveTypes = ['stationary', 'left', 'right', 'forward'];
            const moveType = moveTypes[Math.floor(Math.random() * moveTypes.length)];

            targets.push({
                x: (Math.random() - 0.5) * (TRACK_WIDTH - 1.5),
                y: 0, // Ground level
                z: z + 15,
                vx: 0,
                vz: 0,
                moveType: moveType,
                tracked: false
            });
        }
    }

    return newWalls;
};

// Initialize track
walls = generateTrackSection(0, GENERATION_DISTANCE);
lastGeneratedZ = GENERATION_DISTANCE;

// Keyboard handling
document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;

    // Handle shift key for crouching
    if (e.key === 'Shift') {
        isCrouching = true;
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;

    // Handle shift key for crouching
    if (e.key === 'Shift') {
        isCrouching = false;
    }
});

// Track mouse position for aiming
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Click to shoot
canvas.addEventListener('click', () => {
    if (lastShot >= SHOOT_COOLDOWN) {
        shootProjectile();
        lastShot = 0;
    }
});

// Shoot projectile with 'e' key
const shootProjectile = () => {
    if (gameEnded) return; // Don't shoot after game ends

    stats.shotsFired++; // Track shot

    const clickX = (mouseX / canvas.width) * 2 - 1;
    const clickY = 1 - (mouseY / canvas.height) * 2;

    const speed = 8.0;

    // Calculate forward and right directions based on character rotation
    const forwardDir = {x: -Math.sin(rotationAngle), z: Math.cos(rotationAngle)};
    const rightDir = {x: Math.cos(rotationAngle), z: Math.sin(rotationAngle)};

    // Combine forward and right based on mouse X position
    const vx = (forwardDir.x + rightDir.x * clickX) * speed;
    const vz = (forwardDir.z + rightDir.z * clickX) * speed;
    const vy = clickY * speed * 0.5;

    // Create projectile from player position
    projectiles.push({
        x: worldX,
        y: yPosition + 0.3, // Shoot from chest height
        z: worldZ,
        vx: vx,
        vy: vy,
        vz: vz,
        lifetime: 3.0, // seconds before despawn
        bounces: 0, // Track number of floor bounces
        ricochets: 0 // Track number of wall ricochets
    });
};

let lastShot = 0; // Track time since last shot
const SHOOT_COOLDOWN = 0.2; // 200ms between shots

// Collision detection
const checkCollision = (newX, newZ) => {
    const characterRadius = 0.2;
    const headHeight = 0.55 - crouchHeight; // Adjust head height when crouching
    const bodyBottom = -0.35 + crouchHeight * 0.5; // Body bottom adjusts with crouch

    // Check static walls
    for (const wall of walls) {
        const wallMinX = wall.x - wall.width / 2;
        const wallMaxX = wall.x + wall.width / 2;
        const wallMinZ = wall.z - wall.depth / 2;
        const wallMaxZ = wall.z + wall.depth / 2;

        // Check if character would collide with this wall
        if (newX + characterRadius > wallMinX &&
            newX - characterRadius < wallMaxX &&
            newZ + characterRadius > wallMinZ &&
            newZ - characterRadius < wallMaxZ) {

            // If wall is tall or we're not high enough to jump over it
            if (wall.height >= 1.0 || yPosition < wall.height) {
                wall.failed = true; // Mark as failed
                return true; // Collision!
            }
        }
    }

    // Check moving walls
    for (const wall of movingWalls) {
        const wallMinX = wall.x - wall.width / 2;
        const wallMaxX = wall.x + wall.width / 2;
        const wallMinZ = wall.z - wall.depth / 2;
        const wallMaxZ = wall.z + wall.depth / 2;

        if (newX + characterRadius > wallMinX &&
            newX - characterRadius < wallMaxX &&
            newZ + characterRadius > wallMinZ &&
            newZ - characterRadius < wallMaxZ) {

            if (wall.height >= 1.0 || yPosition < wall.height) {
                wall.failed = true; // Mark as failed
                return true;
            }
        }
    }

    // Check flying obstacles
    for (const obstacle of flyingObstacles) {
        const obstacleMinX = obstacle.x - obstacle.width / 2;
        const obstacleMaxX = obstacle.x + obstacle.width / 2;
        const obstacleMinZ = obstacle.z - obstacle.depth / 2;
        const obstacleMaxZ = obstacle.z + obstacle.depth / 2;

        if (newX + characterRadius > obstacleMinX &&
            newX - characterRadius < obstacleMaxX &&
            newZ + characterRadius > obstacleMinZ &&
            newZ - characterRadius < obstacleMaxZ) {

            // Check if player's height overlaps with the flying obstacle
            // Player is from bodyBottom to headHeight
            // Obstacle is from yMin to yMax
            // They collide if player's top is above obstacle bottom AND player's bottom is below obstacle top
            if (headHeight + yPosition >= obstacle.yMin && bodyBottom + yPosition <= obstacle.yMax) {
                obstacle.failed = true; // Mark as failed
                return true;
            }
        }
    }

    return false;
};

// Create wall geometry
const createWallGeometry = (wall) => {
    const hw = wall.width / 2;
    const hd = wall.depth / 2;
    const h = wall.height;

    const vertices = [
        {x: wall.x - hw, y: 0, z: wall.z - hd},
        {x: wall.x + hw, y: 0, z: wall.z - hd},
        {x: wall.x + hw, y: h, z: wall.z - hd},
        {x: wall.x - hw, y: h, z: wall.z - hd},
        {x: wall.x - hw, y: 0, z: wall.z + hd},
        {x: wall.x + hw, y: 0, z: wall.z + hd},
        {x: wall.x + hw, y: h, z: wall.z + hd},
        {x: wall.x - hw, y: h, z: wall.z + hd},
    ];

    const faces = [
        [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7],
        [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0],
    ];

    return {vertices, faces};
};

// Create floor geometry function (generates floor around current position)
const createFloor = (centerZ) => {
    const floorSize = 30;
    const floorSegments = 20;
    const floorVs = [];
    const floorFs = [];

    // Floor extends from centerZ-5 to centerZ+25 (mostly ahead)
    const startZ = centerZ - 5;

    for (let i = 0; i <= floorSegments; i++) {
        for (let j = 0; j <= floorSegments; j++) {
            floorVs.push({
                x: (i / floorSegments - 0.5) * floorSize,
                y: -0.35,
                z: startZ + (j / floorSegments) * floorSize
            });
        }
    }
    for (let i = 0; i < floorSegments; i++) {
        for (let j = 0; j < floorSegments; j++) {
            const idx = i * (floorSegments + 1) + j;
            floorFs.push([
                idx,
                idx + 1,
                idx + floorSegments + 2,
                idx + floorSegments + 1
            ]);
        }
    }

    return {floorVs, floorFs};
};

// Show end game statistics screen
const showEndGameScreen = () => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    // Create results panel
    const panel = document.createElement('div');
    panel.style.cssText = `
        background: #1a1a1a;
        border: 3px solid #50ff50;
        border-radius: 12px;
        padding: 40px;
        min-width: 500px;
        color: #50ff50;
        font-family: monospace;
        box-shadow: 0 0 30px rgba(80, 255, 80, 0.3);
    `;

    // Calculate percentages
    const stationaryPercent = stats.stationaryObstaclesTotal > 0
        ? (stats.stationaryObstaclesCleared / stats.stationaryObstaclesTotal * 100).toFixed(1)
        : 0;
    const movingPercent = stats.movingWallsTotal > 0
        ? (stats.movingWallsCleared / stats.movingWallsTotal * 100).toFixed(1)
        : 0;
    const flyingPercent = stats.flyingObstaclesTotal > 0
        ? (stats.flyingObstaclesDucked / stats.flyingObstaclesTotal * 100).toFixed(1)
        : 0;
    const targetsPercent = stats.targetsTotal > 0
        ? (stats.targetsHit / stats.targetsTotal * 100).toFixed(1)
        : 0;
    const shootingAccuracy = stats.shotsFired > 0
        ? (stats.shotsHit / stats.shotsFired * 100).toFixed(1)
        : 0;

    panel.innerHTML = `
        <h1 style="text-align:center;margin:0 0 30px 0;font-size:36px;">🎯 GAME OVER 🎯</h1>
        <h2 style="margin:0 0 20px 0;font-size:24px;color:#fff;">Final Score: ${Math.floor(score)}</h2>

        <div style="margin-bottom:25px;">
            <h3 style="margin:0 0 10px 0;color:#fff;font-size:20px;">📊 Obstacle Performance</h3>
            <div style="margin-left:20px;">
                <p style="margin:8px 0;">Ground Obstacles: ${stats.stationaryObstaclesCleared}/${stats.stationaryObstaclesTotal} (${stationaryPercent}%)</p>
                <p style="margin:8px 0;">Moving Walls: ${stats.movingWallsCleared}/${stats.movingWallsTotal} (${movingPercent}%)</p>
                <p style="margin:8px 0;">Flying Obstacles: ${stats.flyingObstaclesDucked}/${stats.flyingObstaclesTotal} (${flyingPercent}%)</p>
            </div>
        </div>

        <div style="margin-bottom:25px;">
            <h3 style="margin:0 0 10px 0;color:#fff;font-size:20px;">🎯 Shooting Performance</h3>
            <div style="margin-left:20px;">
                <p style="margin:8px 0;">Targets Hit: ${stats.targetsHit}/${stats.targetsTotal} (${targetsPercent}%)</p>
                <p style="margin:8px 0;">Shots Fired: ${stats.shotsFired}</p>
                <p style="margin:8px 0;">Shots Hit: ${stats.shotsHit}</p>
                <p style="margin:8px 0;font-weight:bold;color:#ff0;">Shooting Accuracy: ${shootingAccuracy}%</p>
            </div>
        </div>

        <div style="text-align:center;margin-top:30px;">
            <button id="restartBtn" style="
                background:#50ff50;
                color:#000;
                border:none;
                padding:15px 40px;
                font-size:18px;
                font-weight:bold;
                border-radius:8px;
                cursor:pointer;
                font-family:monospace;
            ">PLAY AGAIN</button>
        </div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Restart button handler
    document.getElementById('restartBtn').addEventListener('click', () => {
        location.reload();
    });
};

const frame = () => {
    const dt = 1 / FPS;

    // Update game timer
    if (gameStarted && !gameEnded) {
        gameTimer += dt;
        if (gameTimer >= GAME_DURATION) {
            gameEnded = true;
            showEndGameScreen();
        }
    }

    // Handle shooting with 'e' key
    if (keysPressed['e'] && lastShot >= SHOOT_COOLDOWN && !gameEnded) {
        shootProjectile();
        lastShot = 0;
    }
    lastShot += dt;

    // Generate more track if needed
    if (worldZ > lastGeneratedZ - GENERATION_DISTANCE) {
        const newSection = generateTrackSection(lastGeneratedZ, lastGeneratedZ + 20);
        walls.push(...newSection);
        lastGeneratedZ += 20;

        // Remove walls that are far behind
        walls = walls.filter(wall => {
            // Track stationary obstacles when they pass
            if (!wall.tracked && wall.isStationary && wall.z < worldZ) {
                wall.tracked = true;
                stats.stationaryObstaclesTotal++;
            }
            return wall.z > worldZ - 20;
        });
    }

    // Update moving walls and check for collisions
    movingWalls.forEach(wall => {
        wall.z -= MOVING_WALL_SPEED * dt; // Move towards player

        // Track encounter when wall passes player
        if (!wall.tracked && wall.z < worldZ) {
            wall.tracked = true;
            stats.movingWallsTotal++;
        }

        // Check if moving wall is hitting the player
        if (checkCollision(worldX, worldZ)) {
            // Push player back
            worldZ -= MOVING_WALL_SPEED * dt * 1.5;
            collisionFlash = 0.3;
            score = Math.max(0, score - COLLISION_PENALTY);

            // Check if there's already an active negative popup
            const existingNegative = scorePopups.find(p => p.value < 0);
            if (existingNegative) {
                existingNegative.collisionCount = (existingNegative.collisionCount || 1) + 1;
                existingNegative.multiplier = Math.floor(existingNegative.collisionCount / 2) + 1;
                existingNegative.lifetime = 1.0; // Reset lifetime
            } else {
                // Add new negative score popup
                scorePopups.push({
                    value: -COLLISION_PENALTY,
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    lifetime: 1.0,
                    multiplier: 1,
                    collisionCount: 1
                });
            }
        }
    });
    // Remove moving walls that passed behind player
    movingWalls = movingWalls.filter(wall => wall.z > worldZ - 5);

    // Update flying obstacles
    flyingObstacles.forEach(obstacle => {
        // Track encounter when player reaches the obstacle position
        if (!obstacle.tracked && worldZ > obstacle.z - 1) {
            obstacle.tracked = true;
            stats.flyingObstaclesTotal++;

            // Check if player successfully ducked under it
            const characterRadius = 0.2;
            const headHeight = 0.55 - crouchHeight;
            const obstacleMinX = obstacle.x - obstacle.width / 2;
            const obstacleMaxX = obstacle.x + obstacle.width / 2;

            // If player was crouched and in the obstacle's path, they ducked successfully
            if (isCrouching &&
                worldX + characterRadius > obstacleMinX &&
                worldX - characterRadius < obstacleMaxX &&
                headHeight < obstacle.yMin) {
                stats.flyingObstaclesDucked++;
            }
        }

        // Check if flying obstacle is hitting the player
        if (checkCollision(worldX, worldZ)) {
            collisionFlash = 0.3;
            score = Math.max(0, score - COLLISION_PENALTY);

            // Check if there's already an active negative popup
            const existingNegative = scorePopups.find(p => p.value < 0);
            if (existingNegative) {
                existingNegative.collisionCount = (existingNegative.collisionCount || 1) + 1;
                existingNegative.multiplier = Math.floor(existingNegative.collisionCount / 2) + 1;
                existingNegative.lifetime = 1.0; // Reset lifetime
            } else {
                // Add new negative score popup
                scorePopups.push({
                    value: -COLLISION_PENALTY,
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    lifetime: 1.0,
                    multiplier: 1,
                    collisionCount: 1
                });
            }
        }
    });
    // Remove flying obstacles that passed behind player
    flyingObstacles = flyingObstacles.filter(obstacle => obstacle.z > worldZ - 5);

    // Update targets
    targets.forEach(target => {
        // Update velocity based on move type
        if (target.moveType === 'left') {
            target.vx = -TARGET_MOVE_SPEED;
            target.vz = 0;
        } else if (target.moveType === 'right') {
            target.vx = TARGET_MOVE_SPEED;
            target.vz = 0;
        } else if (target.moveType === 'forward') {
            target.vx = 0;
            target.vz = -TARGET_MOVE_SPEED; // Move toward player
        } else { // stationary
            target.vx = 0;
            target.vz = 0;
        }

        // Update position
        target.x += target.vx * dt;
        target.z += target.vz * dt;

        // Update tipping animation if hit
        if (target.hit) {
            target.tipTime += dt;
            target.tipAngle = Math.min(target.tipTime * 3, Math.PI / 2); // Tip over 90 degrees
        }

        // Keep targets within track bounds
        const maxX = TRACK_WIDTH / 2 - 0.3;
        if (target.x < -maxX) target.x = -maxX;
        if (target.x > maxX) target.x = maxX;

        // Track targets that pass behind player without being hit
        if (!target.tracked && target.z < worldZ - 3) {
            target.tracked = true;
            stats.targetsTotal++;
        }
    });
    // Remove targets that passed behind player or finished tipping animation
    targets = targets.filter(target => target.z > worldZ - 5 && (!target.hit || target.tipTime < 1.0));

    // Handle walking with world movement
    isWalking = keysPressed['w'] || false;
    if (isWalking) {
        // Start game on first movement
        if (!gameStarted) {
            gameStarted = true;
        }

        // Calculate new position
        const newWorldZ = worldZ + MOVE_SPEED * dt * Math.cos(rotationAngle);
        const newWorldX = worldX - MOVE_SPEED * dt * Math.sin(rotationAngle);

        // Check collision
        if (!checkCollision(newWorldX, newWorldZ)) {
            const distanceGained = newWorldZ - worldZ;
            // Award points based on distance (100 points per unit)
            score += distanceGained * 100;

            worldZ = newWorldZ;
            worldX = newWorldX;
        } else {
            collisionFlash = 0.3; // Flash for 0.3 seconds
            score = Math.max(0, score - COLLISION_PENALTY); // Dock points, don't go negative

            // Check if there's already an active negative popup
            const existingNegative = scorePopups.find(p => p.value < 0);
            if (existingNegative) {
                existingNegative.multiplier = (existingNegative.multiplier || 1) + 1;
                existingNegative.lifetime = 1.0; // Reset lifetime
            } else {
                // Add new negative score popup
                scorePopups.push({
                    value: -COLLISION_PENALTY,
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    lifetime: 1.0,
                    multiplier: 1
                });
            }
        }
    }

    // Handle rotation
    if (keysPressed['a']) {
        rotationAngle += Math.PI * dt; // Smooth rotation - turn left
    }
    if (keysPressed['d']) {
        rotationAngle -= Math.PI * dt; // Smooth rotation - turn right
    }

    // Handle jumping
    if (keysPressed[' '] && !isJumping && yPosition === 0) {
        isJumping = true;
        jumpVelocity = JUMP_STRENGTH;
    }

    // Update jump physics
    if (isJumping || yPosition > 0) {
        yPosition += jumpVelocity;
        jumpVelocity -= GRAVITY;

        // Check for obstacles beneath player while in air
        if (yPosition > 0.1) {
            const characterRadius = 0.2;

            // Check all obstacles (walls and moving walls)
            [...walls, ...movingWalls].forEach((wall) => {
                const wallMinX = wall.x - wall.width / 2;
                const wallMaxX = wall.x + wall.width / 2;
                const wallMinZ = wall.z - wall.depth / 2;
                const wallMaxZ = wall.z + wall.depth / 2;

                // If player is over this obstacle
                if (worldX + characterRadius > wallMinX &&
                    worldX - characterRadius < wallMaxX &&
                    worldZ + characterRadius > wallMinZ &&
                    worldZ - characterRadius < wallMaxZ &&
                    yPosition > wall.height) {
                    obstaclesUnderPlayer.add(wall.id || `${wall.x}-${wall.z}-${wall.width}`);
                }
            });
        }

        // Land on ground
        if (yPosition <= 0) {
            yPosition = 0;
            jumpVelocity = 0;
            isJumping = false;

            // Award bonus for each obstacle cleared
            if (obstaclesUnderPlayer.size > 0) {
                let successfulClears = 0;

                // Track cleared obstacles
                obstaclesUnderPlayer.forEach(idOrKey => {
                    const obstacle = [...walls, ...movingWalls].find(w => 
                        (w.id !== undefined && w.id === idOrKey) || `${w.x}-${w.z}-${w.width}` === idOrKey
                    );
                    if (obstacle && !obstacle.cleared && !obstacle.failed) {
                        obstacle.cleared = true; // Mark as cleared to prevent double-counting
                        successfulClears++;
                        if (obstacle.isStationary) {
                            stats.stationaryObstaclesCleared++;
                        } else if (obstacle.isMoving) {
                            stats.movingWallsCleared++;
                        }
                    }
                });

                // Only award points for successfully cleared obstacles
                if (successfulClears > 0) {
                    const bonus = JUMP_SUCCESS_BONUS * successfulClears;
                    score += bonus;
                    successFlash = 0.3;

                    // Add score popup
                    scorePopups.push({
                        value: bonus,
                        x: canvas.width / 2,
                        y: canvas.height / 2,
                        lifetime: 1.0 // seconds
                    });
                }

                obstaclesUnderPlayer.clear();
            }
        }
    }

    // Update leg animation
    if (isWalking) {
        legAngle += Math.PI * 2 * dt; // Complete cycle every second
    } else {
        // Gradually return legs to neutral position
        legAngle *= 0.9;
    }

    // Update crouch animation
    const TARGET_CROUCH = isCrouching ? 0.25 : 0;
    crouchHeight += (TARGET_CROUCH - crouchHeight) * 10 * dt; // Smooth transition

    // Update collision flash
    if (collisionFlash > 0) {
        collisionFlash -= dt;
        if (collisionFlash < 0) collisionFlash = 0;
    }

    // Update success flash
    if (successFlash > 0) {
        successFlash -= dt;
        if (successFlash < 0) successFlash = 0;
    }

    // Update score popups
    scorePopups.forEach(popup => {
        popup.lifetime -= dt;
        popup.y -= 100 * dt; // Move upward
    });
    scorePopups = scorePopups.filter(popup => popup.lifetime > 0);

    // Update projectiles
    projectiles.forEach(proj => {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.z += proj.vz * dt;
        proj.vy -= GRAVITY * 5; // Gravity on projectile (stronger than jump gravity)
        proj.lifetime -= dt;

        // Check for floor bounce
        if (proj.y <= -0.35 && proj.bounces < 1 && proj.vy < 0) {
            proj.y = -0.35; // Keep at floor level
            proj.vy = -proj.vy * 0.7; // Reverse and reduce velocity (70% bounce)
            proj.bounces++;
        }

        // Check collision with walls (ricochet off them)
        const projRadius = 0.1;
        for (let i = walls.length - 1; i >= 0; i--) {
            const wall = walls[i];
            const wallMinX = wall.x - wall.width / 2;
            const wallMaxX = wall.x + wall.width / 2;
            const wallMinZ = wall.z - wall.depth / 2;
            const wallMaxZ = wall.z + wall.depth / 2;

            if (proj.x + projRadius > wallMinX &&
                proj.x - projRadius < wallMaxX &&
                proj.z + projRadius > wallMinZ &&
                proj.z - projRadius < wallMaxZ &&
                proj.y >= 0 && proj.y <= wall.height) {

                // Check ricochet limit
                proj.ricochets++;
                if (proj.ricochets >= 4) {
                    proj.lifetime = 0;
                    break;
                }

                // Ricochet off wall - reflect velocity
                const wallWidthRatio = wall.width / (wall.width + wall.depth);
                if (Math.random() < wallWidthRatio) {
                    // Hit Z face (front/back of wall)
                    proj.vz = -proj.vz * 0.8;
                    proj.z = proj.vz > 0 ? wallMinZ - projRadius : wallMaxZ + projRadius;
                } else {
                    // Hit X face (side of wall)
                    proj.vx = -proj.vx * 0.8;
                    proj.x = proj.vx > 0 ? wallMinX - projRadius : wallMaxX + projRadius;
                }
                break;
            }
        }

        // Check collision with moving walls (ricochet)
        for (let i = movingWalls.length - 1; i >= 0; i--) {
            const wall = movingWalls[i];
            const wallMinX = wall.x - wall.width / 2;
            const wallMaxX = wall.x + wall.width / 2;
            const wallMinZ = wall.z - wall.depth / 2;
            const wallMaxZ = wall.z + wall.depth / 2;

            if (proj.x + projRadius > wallMinX &&
                proj.x - projRadius < wallMaxX &&
                proj.z + projRadius > wallMinZ &&
                proj.z - projRadius < wallMaxZ &&
                proj.y >= 0 && proj.y <= wall.height) {

                // Check ricochet limit
                proj.ricochets++;
                if (proj.ricochets >= 4) {
                    proj.lifetime = 0;
                    break;
                }

                // Ricochet off moving wall
                const wallWidthRatio = wall.width / (wall.width + wall.depth);
                if (Math.random() < wallWidthRatio) {
                    proj.vz = -proj.vz * 0.8;
                    proj.z = proj.vz > 0 ? wallMinZ - projRadius : wallMaxZ + projRadius;
                } else {
                    proj.vx = -proj.vx * 0.8;
                    proj.x = proj.vx > 0 ? wallMinX - projRadius : wallMaxX + projRadius;
                }
                break;
            }
        }

        // Check collision with flying obstacles (ricochet)
        for (let i = flyingObstacles.length - 1; i >= 0; i--) {
            const obstacle = flyingObstacles[i];
            const obstacleMinX = obstacle.x - obstacle.width / 2;
            const obstacleMaxX = obstacle.x + obstacle.width / 2;
            const obstacleMinZ = obstacle.z - obstacle.depth / 2;
            const obstacleMaxZ = obstacle.z + obstacle.depth / 2;

            if (proj.x + projRadius > obstacleMinX &&
                proj.x - projRadius < obstacleMaxX &&
                proj.z + projRadius > obstacleMinZ &&
                proj.z - projRadius < obstacleMaxZ &&
                proj.y >= obstacle.yMin && proj.y <= obstacle.yMax) {

                // Check ricochet limit
                proj.ricochets++;
                if (proj.ricochets >= 4) {
                    proj.lifetime = 0;
                    break;
                }

                // Ricochet off flying obstacle
                const obstacleWidthRatio = obstacle.width / (obstacle.width + obstacle.depth);
                if (Math.random() < obstacleWidthRatio) {
                    proj.vz = -proj.vz * 0.8;
                } else {
                    proj.vx = -proj.vx * 0.8;
                }
                break;
            }
        }

        // Check collision with targets
        for (let i = targets.length - 1; i >= 0; i--) {
            const target = targets[i];
            const targetWidth = 0.4;
            const targetHeight = 0.8;
            const targetDepth = 0.2;

            const targetMinX = target.x - targetWidth / 2;
            const targetMaxX = target.x + targetWidth / 2;
            const targetMinZ = target.z - targetDepth / 2;
            const targetMaxZ = target.z + targetDepth / 2;
            const targetMinY = target.y;
            const targetMaxY = target.y + targetHeight;

            if (proj.x + projRadius > targetMinX &&
                proj.x - projRadius < targetMaxX &&
                proj.z + projRadius > targetMinZ &&
                proj.z - projRadius < targetMaxZ &&
                proj.y >= targetMinY && proj.y <= targetMaxY) {

                // Hit target! Mark as hit for tipping animation
                if (!target.hit) {
                    target.hit = true;
                    target.tipAngle = 0;
                    target.tipTime = 0;
                    proj.lifetime = 0;
                    score += 100; // Good points for hitting targets

                    // Track target encounter and hit
                    if (!target.tracked) {
                        target.tracked = true;
                        stats.targetsTotal++;
                    }
                    stats.targetsHit++;
                    stats.shotsHit++;

                    scorePopups.push({
                        value: 100,
                        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
                        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
                        lifetime: 1.0
                    });
                }
                break;
            }
        }
    });

    // Remove expired projectiles
    projectiles = projectiles.filter(proj => proj.lifetime > 0 && proj.y > -1);

    clear();

    // Draw collision flash effect
    if (collisionFlash > 0) {
        const alpha = collisionFlash / 0.3; // Fade from 1 to 0
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw success flash effect
    if (successFlash > 0) {
        const alpha = successFlash / 0.3;
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Prepare faces with depth information
    const facesWithDepth = [];

    // Generate floor around current position (account for parallax)
    const {floorVs, floorFs} = createFloor(worldZ * 1.5);

    // Add floor faces
    floorFs.forEach(f => {
        let totalZ = 0;
        const transformedPoints = f.map(i => {
            let v = floorVs[i];

            // Apply world offset with parallax (floor moves faster - 1.5x speed)
            v = {x: v.x - worldX * 1.5, y: v.y, z: v.z - worldZ * 1.5};

            // Apply vertical viewing angle
            v = rotateYZ(v, verticalViewAngle);

            // Apply translation
            const transformed = translateZ(v, dz);
            totalZ += transformed.z;

            return screen(project(transformed));
        });

        // Only add faces that are in front of camera
        const avgZ = totalZ / f.length;
        if (avgZ > 0.2) {
            facesWithDepth.push({
                points: transformedPoints,
                avgZ: avgZ,
                color: '#444' // Dark gray floor
            });
        }
    });

    // Add wall faces
    walls.forEach(wall => {
        const {vertices, faces} = createWallGeometry(wall);

        faces.forEach(f => {
            let totalZ = 0;
            const transformedPoints = f.map(i => {
                let v = vertices[i];

                // Apply world offset
                v = {x: v.x - worldX, y: v.y, z: v.z - worldZ};

                // Apply vertical viewing angle
                v = rotateYZ(v, verticalViewAngle);

                // Apply translation
                const transformed = translateZ(v, dz);
                totalZ += transformed.z;

                return screen(project(transformed));
            });

            // Only add faces that are in front of camera
            const avgZ = totalZ / f.length;
            if (avgZ > 0.2) {
                facesWithDepth.push({
                    points: transformedPoints,
                    avgZ: avgZ - 0.2, // Stronger bias for walls to render in front of floor
                    color: wall.color || (wall.height >= 1.0 ? '#666' : '#888') // Use custom color or default
                });
            }
        });
    });
    // Add moving wall faces
    movingWalls.forEach(wall => {
        const {vertices, faces} = createWallGeometry(wall);

        faces.forEach(f => {
            let totalZ = 0;
            const transformedPoints = f.map(i => {
                let v = vertices[i];

                // Apply world offset
                v = {x: v.x - worldX, y: v.y, z: v.z - worldZ};

                // Apply vertical viewing angle
                v = rotateYZ(v, verticalViewAngle);

                // Apply translation
                const transformed = translateZ(v, dz);
                totalZ += transformed.z;

                return screen(project(transformed));
            });

            // Only add faces that are in front of camera
            const avgZ = totalZ / f.length;
            if (avgZ > 0.2) {
                facesWithDepth.push({
                    points: transformedPoints,
                    avgZ: avgZ - 0.2,
                    color: '#f80' // Orange for moving walls
                });
            }
        });
    });

    // Add flying obstacle faces
    flyingObstacles.forEach(obstacle => {
        const hw = obstacle.width / 2;
        const hd = obstacle.depth / 2;

        const vertices = [
            {x: obstacle.x - hw, y: obstacle.yMin, z: obstacle.z - hd},
            {x: obstacle.x + hw, y: obstacle.yMin, z: obstacle.z - hd},
            {x: obstacle.x + hw, y: obstacle.yMax, z: obstacle.z - hd},
            {x: obstacle.x - hw, y: obstacle.yMax, z: obstacle.z - hd},
            {x: obstacle.x - hw, y: obstacle.yMin, z: obstacle.z + hd},
            {x: obstacle.x + hw, y: obstacle.yMin, z: obstacle.z + hd},
            {x: obstacle.x + hw, y: obstacle.yMax, z: obstacle.z + hd},
            {x: obstacle.x - hw, y: obstacle.yMax, z: obstacle.z + hd},
        ];

        const faces = [
            [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7],
            [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0],
        ];

        faces.forEach(f => {
            let totalZ = 0;
            const transformedPoints = f.map(i => {
                let v = vertices[i];

                // Apply world offset
                v = {x: v.x - worldX, y: v.y, z: v.z - worldZ};

                // Apply vertical viewing angle
                v = rotateYZ(v, verticalViewAngle);

                // Apply translation
                const transformed = translateZ(v, dz);
                totalZ += transformed.z;

                return screen(project(transformed));
            });

            // Only add faces that are in front of camera
            const avgZ = totalZ / f.length;
            if (avgZ > 0.2) {
                facesWithDepth.push({
                    points: transformedPoints,
                    avgZ: avgZ - 0.2,
                    color: obstacle.color || '#c0f' // Use custom color or default purple
                });
            }
        });
    });

    // Add target faces (player-sized with bullseye)
    targets.forEach(target => {
        // Create a simple rectangular target - slightly larger
        const width = 0.4;
        const height = 0.8;
        const depth = 0.2;

        const vertices = [
            {x: target.x - width/2, y: target.y, z: target.z - depth/2},
            {x: target.x + width/2, y: target.y, z: target.z - depth/2},
            {x: target.x + width/2, y: target.y + height, z: target.z - depth/2},
            {x: target.x - width/2, y: target.y + height, z: target.z - depth/2},
            {x: target.x - width/2, y: target.y, z: target.z + depth/2},
            {x: target.x + width/2, y: target.y, z: target.z + depth/2},
            {x: target.x + width/2, y: target.y + height, z: target.z + depth/2},
            {x: target.x - width/2, y: target.y + height, z: target.z + depth/2},
        ];

        const faces = [
            [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7],
            [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0],
        ];

        faces.forEach((f, faceIdx) => {
            let totalZ = 0;
            const transformedPoints = f.map(i => {
                let v = vertices[i];

                // Apply tipping rotation if target is hit
                if (target.hit && target.tipAngle > 0) {
                    // Rotate backwards around bottom edge
                    const pivotY = target.y;
                    const relativeY = v.y - pivotY;
                    const relativeZ = v.z - target.z;

                    // Rotate around X axis (tip backwards)
                    const cosA = Math.cos(-target.tipAngle);
                    const sinA = Math.sin(-target.tipAngle);
                    v = {
                        x: v.x,
                        y: pivotY + relativeY * cosA - relativeZ * sinA,
                        z: target.z + relativeY * sinA + relativeZ * cosA
                    };
                }

                // Apply world offset
                v = {x: v.x - worldX, y: v.y, z: v.z - worldZ};

                // Apply vertical viewing angle
                v = rotateYZ(v, verticalViewAngle);

                // Apply translation
                const transformed = translateZ(v, dz);
                totalZ += transformed.z;

                return screen(project(transformed));
            });

            const avgZ = totalZ / f.length;
            if (avgZ > 0.2) {
                // Front and back faces get bullseye, sides are red
                const isFrontOrBack = faceIdx === 0 || faceIdx === 1;
                facesWithDepth.push({
                    points: transformedPoints,
                    avgZ: avgZ - 0.25,
                    color: isFrontOrBack ? '#fff' : '#f00', // White for bullseye faces, red for sides
                    isBullseye: isFrontOrBack
                });
            }
        });
    });

    // Add projectile faces
    projectiles.forEach(proj => {
        const projRadius = 0.1;
        const projVs = [
            {x: proj.x - projRadius, y: proj.y - projRadius, z: proj.z - projRadius},
            {x: proj.x + projRadius, y: proj.y - projRadius, z: proj.z - projRadius},
            {x: proj.x + projRadius, y: proj.y + projRadius, z: proj.z - projRadius},
            {x: proj.x - projRadius, y: proj.y + projRadius, z: proj.z - projRadius},
            {x: proj.x - projRadius, y: proj.y - projRadius, z: proj.z + projRadius},
            {x: proj.x + projRadius, y: proj.y - projRadius, z: proj.z + projRadius},
            {x: proj.x + projRadius, y: proj.y + projRadius, z: proj.z + projRadius},
            {x: proj.x - projRadius, y: proj.y + projRadius, z: proj.z + projRadius},
        ];

        const projFs = [
            [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7],
            [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0],
        ];

        projFs.forEach(f => {
            let totalZ = 0;
            const transformedPoints = f.map(i => {
                let v = projVs[i];

                // Apply world offset
                v = {x: v.x - worldX, y: v.y, z: v.z - worldZ};

                // Apply vertical viewing angle
                v = rotateYZ(v, verticalViewAngle);

                // Apply translation
                const transformed = translateZ(v, dz);
                totalZ += transformed.z;

                return screen(project(transformed));
            });

            const avgZ = totalZ / f.length;
            if (avgZ > 0.2) {
                facesWithDepth.push({
                    points: transformedPoints,
                    avgZ: avgZ - 0.3,
                    color: '#ff0' // Yellow projectiles
                });
            }
        });
    });

    // Add character faces
    robloxFs.forEach(f => {
        let totalZ = 0;
        const transformedPoints = f.map(i => {
            let v = robloxVs[i];

            // Apply crouch offset (compress character vertically)
            v = {x: v.x, y: v.y - crouchHeight * 0.5, z: v.z};

            // Scale down upper body when crouching
            if (v.y > 0) {
                v.y *= (1 - crouchHeight * 0.5);
            }

            // Apply jump offset
            v = {x: v.x, y: v.y + yPosition, z: v.z};

            // Apply leg rotation
            if (i >= 32 && i <= 39) { // Left leg
                const pivot = {x: -0.07, y: yPosition, z: 0};
                v = rotateAroundPoint(v, pivot, rotateYZ, Math.sin(legAngle) * 0.3);
            } else if (i >= 40 && i <= 47) { // Right leg
                const pivot = {x: 0.07, y: yPosition, z: 0};
                v = rotateAroundPoint(v, pivot, rotateYZ, -Math.sin(legAngle) * 0.3);
            }

            // Apply rotation from keyboard
            v = rotateXZ(v, rotationAngle);

            // Apply vertical viewing angle (look down at character)
            v = rotateYZ(v, verticalViewAngle);

            // Apply translation
            const transformed = translateZ(v, dz);
            totalZ += transformed.z;

            return screen(project(transformed));
        });

        facesWithDepth.push({
            points: transformedPoints,
            avgZ: totalZ / f.length - 0.5, // Bias character to always render in front
            color: '#fff' // White character
        });
    });

    // Sort faces by depth (draw farthest first)
    facesWithDepth.sort((a, b) => b.avgZ - a.avgZ);

    // Render sorted faces
    facesWithDepth.forEach(face => {
        fillPolygon(face.points, face.color);

        // Draw bullseye pattern on target faces
        if (face.isBullseye && face.points.length === 4) {
            const centerX = (face.points[0].x + face.points[1].x + face.points[2].x + face.points[3].x) / 4;
            const centerY = (face.points[0].y + face.points[1].y + face.points[2].y + face.points[3].y) / 4;
            const radius = Math.min(
                Math.abs(face.points[1].x - face.points[0].x),
                Math.abs(face.points[2].y - face.points[0].y)
            ) / 3;

            // Draw concentric circles for bullseye
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#f00';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#f00';
            ctx.fill();
        }
    });

    // Draw red aim dot
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw crosshair lines
    ctx.beginPath();
    ctx.moveTo(mouseX - 15, mouseY);
    ctx.lineTo(mouseX - 5, mouseY);
    ctx.moveTo(mouseX + 5, mouseY);
    ctx.lineTo(mouseX + 15, mouseY);
    ctx.moveTo(mouseX, mouseY - 15);
    ctx.lineTo(mouseX, mouseY - 5);
    ctx.moveTo(mouseX, mouseY + 5);
    ctx.lineTo(mouseX, mouseY + 15);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw distance and score
    ctx.fillStyle = '#50ff50';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Distance: ${Math.floor(worldZ)}m`, 20, 40);
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 75);

    // Draw timer
    if (gameStarted && !gameEnded) {
        const timeLeft = Math.max(0, GAME_DURATION - gameTimer);
        ctx.fillText(`Time: ${timeLeft.toFixed(1)}s`, 20, 110);
    }

    // Draw score popups
    scorePopups.forEach(popup => {
        const progress = 1 - (popup.lifetime / 1.0); // 0 to 1
        const alpha = popup.lifetime; // Fade out
        const scale = 1 + progress * 0.5; // Scale up slightly

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = popup.value > 0 ? '#0f0' : '#f00'; // Green for positive, red for negative
        ctx.font = `bold ${Math.floor(32 * scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;

        const baseValue = popup.value > 0 ? popup.value : popup.value;
        const multiplierText = (popup.value < 0 && popup.multiplier > 1) ? `x${popup.multiplier}` : '';
        const text = popup.value > 0 ? `+${Math.floor(popup.value)}${multiplierText}` : `${baseValue}${multiplierText}`;
        ctx.strokeText(text, popup.x, popup.y);
        ctx.fillText(text, popup.x, popup.y);

        ctx.restore();
    });

    setTimeout(frame, 1000 / FPS);
};

// Start animation
frame();
