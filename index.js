import { penguinVs, penguinFs } from './peng.js';

const BG = '#101010';
const FG = '#50ff50';
console.log(game);
game.width = 800;
game.height = 800;
const ctx = game.getContext('2d');
console.log(ctx);
const clear = () => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, game.width, game.height);
};

const point = ({x, y}) => {
    const s = 20;
    ctx.fillStyle = FG;
    ctx.fillRect(x - s/2, y - s/2, s, s);
};

const line = (p1, p2) => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = FG;
    ctx.stroke();
};

const fillPolygon = (points) => {
    if (points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = FG;
    ctx.fill();
    ctx.strokeStyle = BG;
    ctx.lineWidth = 1;
    ctx.stroke();
};

const screen = (p) => ({
    x: (p.x + 1) / 2 * game.width,
    y: (1 - (p.y + 1) / 2) * game.height,
});

const project = ({ x, y, z }) => ({
    x: x / z,
    y: y / z,
});

const cubeVs = [
    {x: -0.25, y: -0.25, z: 0.25},  // 0: front bottom left
    {x: 0.25, y: -0.25, z: 0.25},   // 1: front bottom right
    {x: 0.25, y: 0.25, z: 0.25},    // 2: front top right
    {x: -0.25, y: 0.25, z: 0.25},   // 3: front top left

    {x: -0.25, y: -0.25, z: -0.25}, // 4: back bottom left
    {x: 0.25, y: -0.25, z: -0.25},  // 5: back bottom right
    {x: 0.25, y: 0.25, z: -0.25},   // 6: back top right
    {x: -0.25, y: 0.25, z: -0.25},  // 7: back top left
];

const cubeFs = [
    [0, 1, 2, 3], // front face
    [5, 4, 7, 6], // back face
    [4, 0, 3, 7], // left face
    [1, 5, 6, 2], // right face
    [3, 2, 6, 7], // top face
    [4, 5, 1, 0], // bottom face
];

// Cylinder (16-sided)
const cylinderVs = [];
const cylinderFs = [];
const cylinderSides = 16;
const cylinderRadius = 0.25;
const cylinderHeight = 0.5;
for (let i = 0; i < cylinderSides; i++) {
    const angle = (i / cylinderSides) * Math.PI * 2;
    cylinderVs.push({x: Math.cos(angle) * cylinderRadius, y: cylinderHeight / 2, z: Math.sin(angle) * cylinderRadius});
    cylinderVs.push({x: Math.cos(angle) * cylinderRadius, y: -cylinderHeight / 2, z: Math.sin(angle) * cylinderRadius});
}
for (let i = 0; i < cylinderSides; i++) {
    const next = (i + 1) % cylinderSides;
    cylinderFs.push([i * 2, next * 2]); // top circle
    cylinderFs.push([i * 2 + 1, next * 2 + 1]); // bottom circle
    cylinderFs.push([i * 2, i * 2 + 1]); // vertical edges
}

// Cone (16-sided)
const coneVs = [];
const coneFs = [];
const coneSides = 16;
const coneRadius = 0.3;
const coneHeight = 0.5;
coneVs.push({x: 0, y: coneHeight, z: 0}); // apex
for (let i = 0; i < coneSides; i++) {
    const angle = (i / coneSides) * Math.PI * 2;
    coneVs.push({x: Math.cos(angle) * coneRadius, y: -coneHeight / 2, z: Math.sin(angle) * coneRadius});
}
for (let i = 0; i < coneSides; i++) {
    const next = ((i + 1) % coneSides) + 1;
    coneFs.push([i + 1, next]); // base circle
    coneFs.push([0, i + 1]); // edges to apex
}

// Double pyramid (octahedron)
const octahedronVs = [
    {x: 0, y: 0.4, z: 0}, // top apex
    {x: 0.3, y: 0, z: 0}, // middle square
    {x: 0, y: 0, z: 0.3},
    {x: -0.3, y: 0, z: 0},
    {x: 0, y: 0, z: -0.3},
    {x: 0, y: -0.4, z: 0}, // bottom apex
];
const octahedronFs = [
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], // top pyramid
    [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1], // bottom pyramid
];

// Roblox character
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

const rotateXZ = ({x, y, z}, angle) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
        x: x * cosA - z * sinA,
        y: y,
        z: x * sinA + z * cosA,
    };
};

const rotateYZ = ({x, y, z}, angle) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
        x: x,
        y: y * cosA - z * sinA,
        z: y * sinA + z * cosA,
    };
};

const FPS = 60;
let dz = 1;
let angle = 0;
let verticalAngle = 0;
let vs = [];
let fs = [];
let animationRunning = false;
let animationTimeout = null;
let fillMode = false;
let isWalking = false;
let legAngle = 0;

// Keyboard handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') {
        isWalking = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') {
        isWalking = false;
    }
});

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

const frame = () => {
    const dt = 1 / FPS;
    // dz += 1 * dt;
    angle += Math.PI * dt;

    // Update leg animation
    if (isWalking) {
        legAngle += Math.PI * 2 * dt; // Complete cycle every second
    } else {
        // Gradually return legs to neutral position
        legAngle *= 0.9;
    }

    clear();

    if (fillMode) {
        // Render filled polygons
        for (const f of fs) {
            const transformedPoints = f.map(i => {
                let v = vs[i];

                // Apply leg rotation for roblox character
                if (vs === robloxVs) {
                    if (i >= 32 && i <= 39) { // Left leg
                        const pivot = {x: -0.07, y: 0, z: 0};
                        v = rotateAroundPoint(v, pivot, rotateYZ, Math.sin(legAngle) * 0.3);
                    } else if (i >= 40 && i <= 47) { // Right leg
                        const pivot = {x: 0.07, y: 0, z: 0};
                        v = rotateAroundPoint(v, pivot, rotateYZ, -Math.sin(legAngle) * 0.3);
                    }
                }

                return screen(project(translateZ(rotateYZ(rotateXZ(v, angle), verticalAngle), dz)));
            });
            fillPolygon(transformedPoints);
        }
    } else {
        // Render wireframe
        for (const f of fs) {
            for (let i = 0; i < f.length; ++i) {
                let v1 = vs[f[i]];
                let v2 = vs[f[(i + 1) % f.length]];

                // Apply leg rotation for roblox character
                if (vs === robloxVs) {
                    if (f[i] >= 32 && f[i] <= 39) { // Left leg
                        const pivot = {x: -0.07, y: 0, z: 0};
                        v1 = rotateAroundPoint(v1, pivot, rotateYZ, Math.sin(legAngle) * 0.3);
                    } else if (f[i] >= 40 && f[i] <= 47) { // Right leg
                        const pivot = {x: 0.07, y: 0, z: 0};
                        v1 = rotateAroundPoint(v1, pivot, rotateYZ, -Math.sin(legAngle) * 0.3);
                    }

                    if (f[(i + 1) % f.length] >= 32 && f[(i + 1) % f.length] <= 39) { // Left leg
                        const pivot = {x: -0.07, y: 0, z: 0};
                        v2 = rotateAroundPoint(v2, pivot, rotateYZ, Math.sin(legAngle) * 0.3);
                    } else if (f[(i + 1) % f.length] >= 40 && f[(i + 1) % f.length] <= 47) { // Right leg
                        const pivot = {x: 0.07, y: 0, z: 0};
                        v2 = rotateAroundPoint(v2, pivot, rotateYZ, -Math.sin(legAngle) * 0.3);
                    }
                }

                line(
                    screen(
                        project(
                            translateZ(
                                rotateYZ(
                                    rotateXZ(v1, angle),
                                    verticalAngle
                                ),
                                dz
                            )
                        )
                    ),
                    screen(
                        project(
                            translateZ(
                                rotateYZ(
                                    rotateXZ(v2, angle),
                                    verticalAngle
                                ),
                                dz
                            )
                        )
                    )
                );
            }
        }
    }
    if (animationRunning) {
        animationTimeout = setTimeout(frame, 1000 / FPS);
    }
};

const drawCube = () => {
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    vs = cubeVs;
    fs = cubeFs;
    angle = 0;
    animationRunning = true;
    frame();
};

const drawPenguin = () => {
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    vs = penguinVs;
    fs = penguinFs;
    angle = 0;
    animationRunning = true;
    frame();
};

const drawCylinder = () => {
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    vs = cylinderVs;
    fs = cylinderFs;
    angle = 0;
    animationRunning = true;
    frame();
};

const drawCone = () => {
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    vs = coneVs;
    fs = coneFs;
    angle = 0;
    animationRunning = true;
    frame();
};

const drawOctahedron = () => {
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    vs = octahedronVs;
    fs = octahedronFs;
    angle = 0;
    animationRunning = true;
    frame();
};

const drawRoblox = () => {
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    vs = robloxVs;
    fs = robloxFs;
    angle = 0;
    animationRunning = true;
    frame();
};

const toggleFillMode = () => {
    fillMode = !fillMode;
};

const updateVerticalAngle = (value) => {
    verticalAngle = (value / 100) * Math.PI * 2;
};

// Make functions available globally for onclick handlers
window.drawCube = drawCube;
window.drawPenguin = drawPenguin;
window.drawCylinder = drawCylinder;
window.drawCone = drawCone;
window.drawOctahedron = drawOctahedron;
window.drawRoblox = drawRoblox;
window.toggleFillMode = toggleFillMode;
window.updateVerticalAngle = updateVerticalAngle;

// Don't auto-start anymore
// setTimeout(frame, 1000 / FPS);
