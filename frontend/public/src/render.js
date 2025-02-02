const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas scaling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Rendering function
function render(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
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

    // Scale factors for rendering
    const scaleX = canvas.width / 1024; // Scale factor for X
    const scaleY = canvas.height / 576; // Scale factor for Y

    // Draw players
    Object.values(state.players).forEach((player) => {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x * scaleX, player.y * scaleY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Draw username
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(player.username, player.x * scaleX, player.y * scaleY - 25);
    });

    // Draw projectiles
    ctx.fillStyle = 'red';
    state.projectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * scaleX, p.y * scaleY, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}