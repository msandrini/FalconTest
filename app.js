var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer(app);
var lessMiddleware = require('less-middleware');
server.listen(3000);

app.use(lessMiddleware(__dirname + "/styles", {dest:__dirname}, {}, {compress: true}));
app.use(express.static(__dirname));

var io = require('socket.io').listen(server);

io.on('connection', function (socket) {
  socket.on('new pub to server', function (data) {
    socket.emit('pub return from server', data);
  });
  socket.on('new reach to server', function (data) {
    socket.emit('reach return from server', data);
  });
});