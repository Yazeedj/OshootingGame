const express = require('express');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const deletionTimeouts = {}; // Track player deletion timeouts

app.use(express.static(path.join(__dirname, '../frontend/public')));

// CORS middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const server = app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

const io = socketio(server);

// Game state
const players = {};
const projectiles = {};
let projectileId = 0;

// Constants
const PLAYER_RADIUS = 20;
const PROJECTILE_RADIUS = 5;
const PROJECTILE_SPEED = 10;
const SHOOT_COOLDOWN = 200;

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Initialize player
    players[socket.id] = {
        id: socket.id,
        x: 1024 * Math.random(),
        y: 576 * Math.random(),
        direction: 0,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        username: 'Player',
        score: 0,
        health: 100,
        cooldown: false
    };

    // Set username
    socket.on('setUsername', (username) => {
        if (players[socket.id]) {
            players[socket.id].username = username.substring(0, 15);
        }
    });

    // Handle movement input
    socket.on('input', (data) => {
        const player = players[socket.id];
        if (!player) return;

        const speed = 5;
        player.direction = 0; // Reset direction

        if (data.keys.w) {
            player.y -= speed;
            player.direction = -Math.PI / 2;
        }
        if (data.keys.s) {
            player.y += speed;
            player.direction = Math.PI / 2;
        }
        if (data.keys.a) {
            player.x -= speed;
            player.direction = Math.PI;
        }
        if (data.keys.d) {
            player.x += speed;
            player.direction = 0;
        }

        // Keep player within bounds
        player.x = Math.max(PLAYER_RADIUS, Math.min(1024 - PLAYER_RADIUS, player.x));
        player.y = Math.max(PLAYER_RADIUS, Math.min(576 - PLAYER_RADIUS, player.y));
    });

    // Handle shooting with cooldown
    socket.on('shoot', ({ angle }) => {
        const player = players[socket.id];
        if (!player || player.cooldown || player.health <= 0) return;

        // Set cooldown
        player.cooldown = true;
        setTimeout(() => (player.cooldown = false), SHOOT_COOLDOWN);

        // Create projectile
        projectileId++;
        projectiles[projectileId] = {
            id: projectileId,
            x: player.x,
            y: player.y,
            direction: angle,
            owner: socket.id,
            velocity: {
                x: Math.cos(angle) * PROJECTILE_SPEED,
                y: Math.sin(angle) * PROJECTILE_SPEED
            }
        };
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        Object.values(projectiles).forEach((projectile) => {
            if (projectile.owner === socket.id) {
                delete projectiles[projectile.id];
            }
        });
        delete players[socket.id];
    });

    // Handle respawn
    socket.on('respawnPlayer', () => {
        if (deletionTimeouts[socket.id]) {
            clearTimeout(deletionTimeouts[socket.id]);
            delete deletionTimeouts[socket.id];
        }

        players[socket.id] = {
            id: socket.id,
            x: 1024 * Math.random(),
            y: 576 * Math.random(),
            direction: 0,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            username: 'Player',
            score: 0,
            health: 100,
            cooldown: false
        };

        socket.emit('update', {
            players: players,
            projectiles: Object.values(projectiles)
        });
    });
});

// Helper function to calculate distance
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// Game loop
setInterval(() => {
    // Update projectiles
    Object.values(projectiles).forEach((projectile) => {
        projectile.x += projectile.velocity.x;
        projectile.y += projectile.velocity.y;

        // Remove out-of-bounds projectiles
        if (projectile.x < -50 || projectile.x > 1074 || projectile.y < -50 || projectile.y > 626) {
            delete projectiles[projectile.id];
        }
    });

    // Check collisions
    Object.values(projectiles).forEach((projectile) => {
        Object.values(players).forEach((player) => {
            if (
                player.health <= 0 ||
                player.id === projectile.owner ||
                distance(projectile.x, projectile.y, player.x, player.y) > PLAYER_RADIUS + PROJECTILE_RADIUS
            ) return;

            // Handle hit
            player.health -= 55;
            delete projectiles[projectile.id];

            if (player.health <= 0) {
                if (players[projectile.owner]) {
                    players[projectile.owner].score += 10;
                }

                io.to(player.id).emit('gameOver', player.score);

                deletionTimeouts[player.id] = setTimeout(() => {
                    delete players[player.id];
                    io.emit('updatePlayers', players);
                }, 500); // 500ms delay before deletion
            }
        });
    });

    // Send game state
    io.emit('update', {
        players: players,
        projectiles: Object.values(projectiles)
    });
}, 1000 / 60);
