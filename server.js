const http = require('http');
const app = require('./app');
const { port }= require('./config/config');
const PORT = port || 8080;

const server = http.createServer(app);

let connectecUsers = [];
var io = require('socket.io').listen(server);
require('./controllers/sockets')(io, connectecUsers)

server.listen(PORT);