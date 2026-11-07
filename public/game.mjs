import Player from '/Player.mjs';
import Collectible from '/Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');

const SIZE = 20;
const SPEED = 10;

let myId = null;
let players = {};
let collectible = null;

socket.on('init', (data) => {
  myId = data.id;
  players = {};
  Object.values(data.players).forEach((p) => {
    players[p.id] = new Player(p);
  });
  collectible = new Collectible(data.collectible);
});

socket.on('new-player', (p) => {
  players[p.id] = new Player(p);
});

socket.on('player-update', (p) => {
  players[p.id] = new Player(p);
});

socket.on('remove-player', (id) => {
  delete players[id];
});

socket.on('collectible-update', (c) => {
  collectible = new Collectible(c);
});

const keyToDir = {
  w: 'up', ArrowUp: 'up',
  s: 'down', ArrowDown: 'down',
  a: 'left', ArrowLeft: 'left',
  d: 'right', ArrowRight: 'right',
};

document.addEventListener('keydown', (e) => {
  const dir = keyToDir[e.key];
  if (dir) socket.emit('move-player', { dir, speed: SPEED });
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (collectible) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(collectible.x, collectible.y, SIZE, SIZE);
  }

  Object.values(players).forEach((p) => {
    ctx.fillStyle = p.id === myId ? '#00ff99' : '#ff5577';
    ctx.fillRect(p.x, p.y, SIZE, SIZE);
    ctx.fillStyle = '#000000';
    ctx.font = '10px sans-serif';
    ctx.fillText(p.score, p.x, p.y - 4);
  });

  if (myId && players[myId]) {
    const rank = players[myId].calculateRank(Object.values(players));
    ctx.fillStyle = '#000000';
    ctx.font = '14px sans-serif';
    ctx.fillText(rank, 10, 16);
  }

  requestAnimationFrame(draw);
}

draw();