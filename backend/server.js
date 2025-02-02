const express = require('express');
const socketio = require('socket.io');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.get('/test', (req, res) => {
    res.send('Server is working!');
});

const server = app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

const io = socketio(server);

const players = {};
let projectiles = [];

const PLAYER_RADIUS = 20;
const PROJECTILE_RADIUS = 5;

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Initialize player
    players[socket.id] = {
        x: 1024 * Math.random(),
        y: 576 * Math.random(),
        direction: 0, // Default direction (facing right)
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        username: 'Player',
        score: 0,
        health: 100,
    };

    // Handle player input
    socket.on('input', (data) => {
        const player = players[socket.id];
        if (!player) return;

        const speed = 5;

        // Movement and direction updates
        if (data.keys.w) {
            player.y -= speed;
            player.direction = -Math.PI / 2; // Up
        }
        if (data.keys.s) {
            player.y += speed;
            player.direction = Math.PI / 2; // Down
        }
        if (data.keys.a) {
            player.x -= speed;
            player.direction = Math.PI; // Left
        }
        if (data.keys.d) {
            player.x += speed;
            player.direction = 0; // Right
        }

        // Shooting
        if (data.mouse) {
            const angle = Math.atan2(data.mouse.y - player.y, data.mouse.x - player.x);
            const projectile = {
                x: player.x,
                y: player.y,
                direction: angle,
                owner: socket.id,
            };
            projectiles.push(projectile);
            console.log("Projectile created:", projectile); // Debugging line
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        projectiles = projectiles.filter(p => p.owner !== socket.id);
        delete players[socket.id];
    });

    // Handle game over
    socket.on('gameOver', () => {
        delete players[socket.id];
        io.to(socket.id).emit('gameOver');
    });
});

// Game loop
setInterval(() => {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        // Move projectile
        p.x += Math.cos(p.direction) * 10;
        p.y += Math.sin(p.direction) * 10;

        // Remove projectile if out of bounds
        if (p.x < 0 || p.x > 1024 || p.y < 0 || p.y > 576) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check for collisions with players
        for (const [id, player] of Object.entries(players)) {
            if (!player || id === p.owner || player.health <= 0) continue;

            if (distance(p.x, p.y, player.x, player.y) < PLAYER_RADIUS + PROJECTILE_RADIUS) {
                player.health -= 34;

                if (player.health <= 0) {
                    if (players[p.owner]) {
                        players[p.owner].score += 100;
                    }
                    delete players[id];
                    io.to(id).emit('gameOver');
                }

                projectiles.splice(i, 1);
                break;
            }
        }
    }

    // Send updates to all clients
    io.emit('update', { players, projectiles });
}, 1000 / 60);

// Helper function to calculate distance
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}