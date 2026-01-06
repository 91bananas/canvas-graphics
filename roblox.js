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

// World position
let worldX = 0;
let worldZ = 0;

// Scoring
let score = 0;
const COLLISION_PENALTY = 50;
const JUMP_SUCCESS_BONUS = 100;

// Maze walls [{x, z, width, depth, height}]
let walls = [];
let movingWalls = []; // Obstacles that move towards player
let lastGeneratedZ = 0;
const TRACK_WIDTH = 4;
const GENERATION_DISTANCE = 40; // Generate track this far ahead
const MOVING_WALL_SPEED = 2.0; // Speed at which moving walls approach

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
        if (Math.random() > 0.6) {
            // Jumpable obstacle
            newWalls.push({
                x: (Math.random() - 0.5) * (TRACK_WIDTH - 1),
                z: z + 2,
                width: 2,
                depth: 0.3,
                height: 0.3
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
        if (Math.random() > 0.5) {
            movingWalls.push({
                x: (Math.random() - 0.5) * (TRACK_WIDTH - 1),
                z: z + 10,
                width: 1.5,
                depth: 0.3,
                height: 0.4
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
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

// Collision detection
const checkCollision = (newX, newZ) => {
    const characterRadius = 0.2;
    
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

const frame = () => {
    const dt = 1 / FPS;

    // Generate more track if needed
    if (worldZ > lastGeneratedZ - GENERATION_DISTANCE) {
        const newSection = generateTrackSection(lastGeneratedZ, lastGeneratedZ + 20);
        walls.push(...newSection);
        lastGeneratedZ += 20;

        // Remove walls that are far behind
        walls = walls.filter(wall => wall.z > worldZ - 20);
    }

    // Update moving walls and check for collisions
    movingWalls.forEach(wall => {
        wall.z -= MOVING_WALL_SPEED * dt; // Move towards player
        
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

    // Handle walking with world movement
    isWalking = keysPressed['w'] || false;
    if (isWalking) {
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
        rotationAngle -= Math.PI * dt; // Smooth rotation
    }
    if (keysPressed['d']) {
        rotationAngle += Math.PI * dt; // Smooth rotation
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
            [...walls, ...movingWalls].forEach((wall, idx) => {
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
                    obstaclesUnderPlayer.add(`${wall.x}-${wall.z}-${wall.width}`);
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
                const bonus = JUMP_SUCCESS_BONUS * obstaclesUnderPlayer.size;
                score += bonus;
                successFlash = 0.3;
                
                // Add score popup
                scorePopups.push({
                    value: bonus,
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    lifetime: 1.0 // seconds
                });
                
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
                    color: wall.height >= 1.0 ? '#666' : '#888' // Darker for tall walls
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
    // Add character faces
    robloxFs.forEach(f => {
        let totalZ = 0;
        const transformedPoints = f.map(i => {
            let v = robloxVs[i];

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
    });

    // Draw distance and score
    ctx.fillStyle = '#50ff50';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Distance: ${Math.floor(worldZ)}m`, 20, 40);
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 75);
    
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
