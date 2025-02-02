if (!window.canvas) {
    window.canvas = document.getElementById('gameCanvas');
}

// Declare keys and mouse in the global scope
window.keys = { w: false, a: false, s: false, d: false, space: false }; // Add 'space' key
window.mouse = null;
let canShoot = true; // Cooldown flag
const SHOOT_COOLDOWN = 200; // 200ms cooldown

// Store local player state
let localPlayer = null;

// Handle keyboard input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }

    // Trigger shooting when Spacebar is pressed
    if (key === ' ') {
        keys.space = true;
        handleShooting();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }

    // Reset Spacebar state
    if (key === ' ') {
        keys.space = false;
    }
});

// Handle mouse input
canvas.addEventListener('mousedown', (e) => {
    handleShooting(e);
});

canvas.addEventListener('mouseup', () => {
    mouse = null;
});

// Function to handle shooting logic
function handleShooting(event = null) {
    if (canShoot) {
        let mouseX, mouseY;

        if (event) {
            // Mouse-based shooting
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            // Normalize mouse coordinates to game world size (1024x576)
            mouseX = ((event.clientX - rect.left) * scaleX / canvas.width) * 1024;
            mouseY = ((event.clientY - rect.top) * scaleY / canvas.height) * 576;
        } else {
            // Spacebar-based shooting (use player's current position and direction)
            if (!localPlayer) return;

            const angle = localPlayer.direction || 0; // Default to 0 (rightward direction)
            const distance = 500; // Arbitrary distance for shooting forward
            mouseX = localPlayer.x + Math.cos(angle) * distance;
            mouseY = localPlayer.y + Math.sin(angle) * distance;
        }

        // Set mouse coordinates for shooting
        mouse = { x: mouseX, y: mouseY };

        console.log("Shooting at:", mouse); // Debugging line

        canShoot = false;
        setTimeout(() => {
            canShoot = true;
        }, SHOOT_COOLDOWN);
    }
}

// Set username
function setUsername() {
    const username = document.getElementById('usernameInput').value;
    if (username) {
        socket.emit('setUsername', username);
        document.getElementById('usernameForm').classList.add('hidden');
    }
}

// Listen for updates from the server
socket.on('update', (state) => {
    // Update local player state
    if (state.players && state.players[socket.id]) {
        localPlayer = state.players[socket.id];
    }

    render(state); // Render the game state
});