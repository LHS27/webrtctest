'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var PORT = process.env.PORT || 8080;
var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(PORT);


var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

function Room(ID, Client1, Client2) {
	this.ID = ID;
	this.Client1 = Client1;
	this.Client2 = Client2;
}

function PC(RoomID, Client1, Client2) {
	this.RoomID = RoomID;
	this.Client1 = Client1;
	this.Client2 = Client2;
}
socket.on('create or join', Room(inputid, '', '') {
    log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      new Room(inputid, clientid, '')
	  socket.join(inputid);
      log('Client ID ' + socket.id + ' created room ' + inputid);
      socket.emit('created', inputid, socket.id);
    } else if (numClients === 1 ) {
      log('Client ID ' + socket.id + ' joined room ' + inputid);
      io.sockets.in(inputid).emit('join', inputid);
      socket.join(inputid);
      socket.emit('joined', inputid, socket.id);
      io.sockets.in(inputid).emit('ready');
    } else{ // max two clients
      socket.emit('full', inputid);
    }
  });