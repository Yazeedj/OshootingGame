const socket = io();

// Listen for updates from the server
socket.on('update', (state) => {
    render(state); // Ensure render is defined
});

// Handle game over event
socket.on('gameOver', () => {
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('score').textContent = `Final Score: ${state.score || 0}`;
});

// Send input 60 times per second
setInterval(() => {
    if (socket.connected) {
        console.log("Sending input:", { keys: window.keys, mouse: window.mouse }); // Debugging line
        socket.emit('input', { keys: window.keys, mouse: window.mouse }); // Use global keys and mouse
    }
}, 1000 / 60);