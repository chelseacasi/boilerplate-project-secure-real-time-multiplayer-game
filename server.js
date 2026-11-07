require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// --- Security headers (helmet@3 API) ---
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

// Serve the shared game classes so the client imports the exact same source
app.get('/Player.mjs', (req, res) => {
  res.sendFile(process.cwd() + '/Player.mjs');
});
app.get('/Collectible.mjs', (req, res) => {
  res.sendFile(process.cwd() + '/Collectible.mjs');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

// --- Socket.io game logic (no .mjs imports needed on the server) ---
const io = socket(server);

const players = {};

function spawnCollectible() {
  return {
    id: 'coin-' + Math.random().toString(36).slice(2, 9),
    x: Math.floor(Math.random() * 600) + 20,
    y: Math.floor(Math.random() * 440) + 20,
    value: 1,
  };
}

function rectsOverlap(a, b, size = 20) {
  return (
    a.x < b.x + size &&
    a.x + size > b.x &&
    a.y < b.y + size &&
    a.y + size > b.y
  );
}

let collectible = spawnCollectible();

io.on('connection', (socketClient) => {
  const player = {
    id: socketClient.id,
    x: Math.floor(Math.random() * 600) + 20,
    y: Math.floor(Math.random() * 440) + 20,
    score: 0,
  };
  players[socketClient.id] = player;

  socketClient.emit('init', { id: socketClient.id, players, collectible });
  socketClient.broadcast.emit('new-player', player);

  socketClient.on('move-player', ({ dir, speed }) => {
    const p = players[socketClient.id];
    if (!p) return;

    switch (dir) {
      case 'up':
        p.y -= speed;
        break;
      case 'down':
        p.y += speed;
        break;
      case 'left':
        p.x -= speed;
        break;
      case 'right':
        p.x += speed;
        break;
      default:
        return;
    }

    p.x = Math.max(0, Math.min(620, p.x));
    p.y = Math.max(0, Math.min(460, p.y));

    if (rectsOverlap(p, collectible)) {
      p.score += collectible.value;
      collectible = spawnCollectible();
      io.emit('collectible-update', collectible);
    }

    io.emit('player-update', p);
  });

  socketClient.on('disconnect', () => {
    delete players[socketClient.id];
    io.emit('remove-player', socketClient.id);
  });
});

module.exports = app; // For testing