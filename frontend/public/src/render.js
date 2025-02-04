import { socket } from './network.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas scaling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

export function render(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update HUD
    const localPlayer = state.players[socket.id];
    document.getElementById('score').textContent = `Score: ${localPlayer?.score || 0}`;

    // Draw game elements
    drawGrid();
    drawPlayers(state.players);
    drawProjectiles(state.projectiles);
    updateLeaderboard(state.players);
}

function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawPlayers(players) {
    const scaleX = canvas.width / 1024;
    const scaleY = canvas.height / 576;

    Object.values(players).forEach(player => {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x * scaleX, player.y * scaleY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Username text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(player.username, player.x * scaleX, player.y * scaleY - 25);
    });
}

function drawProjectiles(projectiles) {
    const scaleX = canvas.width / 1024;
    const scaleY = canvas.height / 576;

    ctx.fillStyle = 'red';
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x * scaleX, projectile.y * scaleY, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateLeaderboard(players) {
    const leaderboard = document.getElementById('scores');
    leaderboard.innerHTML = '';

    Object.values(players)
        .sort((a, b) => b.score - a.score)
        .forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${player.username}</span><span>${player.score}</span>`;
            if (player.id === socket.id) li.classList.add('highlight');
            leaderboard.appendChild(li);
        });
}