import { io } from "https://cdn.socket.io/4.5.4/socket.io.esm.min.js";
import { render } from "./render.js";

const socket = io("https://oshootinggame-1.onrender.com"); // Your Render backend URL
export { socket };

// Login handling
document.getElementById('launchButton').addEventListener('click', setUsername);
document.getElementById('usernameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setUsername();
});

function setUsername() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) {
        document.getElementById('errorMessage').classList.remove('hidden');
        return;
    }

    document.getElementById('loginModal').style.display = 'none';
    ['gameCanvas', 'leaderboard', 'hud'].forEach(id => {
        document.getElementById(id).style.display = 'block';
    });

    socket.emit('setUsername', username);
}

// Game state updates
socket.on('update', (state) => render(state));

// Game Over handling
socket.on('gameOver', (finalScore) => {
    const gameOver = document.getElementById('gameOver');
    const backdrop = document.getElementById('gameOverBackdrop');

    if (gameOver && backdrop) {
        document.getElementById('finalScore').textContent = finalScore;
        gameOver.style.display = 'block';
        backdrop.style.display = 'block';
        gameOver.classList.add('visible');
        backdrop.classList.add('visible');
    }
});

// Input handling
setInterval(() => {
    if (socket.connected) {
        socket.emit('input', {
            keys: window.keys,
            mouse: window.mouse
        });
    }
}, 1000 / 60);