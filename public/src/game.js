import { socket } from './network.js';

// Initialize global state
window.keys = { w: false, a: false, s: false, d: false };
window.mouse = null;
let canShoot = true;
const SHOOT_COOLDOWN = 200;
let localPlayer = null;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
if (!canvas) throw new Error('Canvas element not found');

// Shooting handling
canvas.addEventListener('mousedown', (e) => {
    if (canShoot && !document.getElementById('gameOver').classList.contains('visible')) {
        handleShooting(e);
        canShoot = false;
        setTimeout(() => canShoot = true, SHOOT_COOLDOWN);
    }
});

function handleShooting(event) {
    if (!localPlayer) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / 1024;
    const scaleY = canvas.height / 576;

    const mouseX = (event.clientX - rect.left) / scaleX;
    const mouseY = (event.clientY - rect.top) / scaleY;

    const angle = Math.atan2(mouseY - localPlayer.y, mouseX - localPlayer.x);
    socket.emit('shoot', { angle });
}

// Keyboard input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in window.keys) window.keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in window.keys) window.keys[key] = false;
});

// Game state updates
socket.on('update', (state) => {
    localPlayer = state.players[socket.id];
});

// Restart functionality
document.getElementById('restartButton').addEventListener('click', () => {
    window.keys = { w: false, a: false, s: false, d: false };

    // Hide Game Over UI
    const gameOverElement = document.getElementById('gameOver');
    const backdropElement = document.getElementById('gameOverBackdrop');

    gameOverElement.classList.remove('visible');
    gameOverElement.style.display = 'none';
    backdropElement.classList.remove('visible');
    backdropElement.style.display = 'none';

    // Reset local player
    localPlayer = null;

    // Emit respawn event
    socket.emit('respawnPlayer');
});