'use strict';
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
      'iceServers': [
    {
      'urls': 'stun:stun.l.google.com:19302'
    },
    {
      'urls': 'turn:192.158.29.39:3478?transport=udp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
  },
  {
      'urls': 'turn:192.158.29.39:3478?transport=tcp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
   }
  ]
};
  var audiosetup;
  if (confirm("OK = true , Annuler  = false")) {
    audiosetup = true;
  } else {
    audiosetup = false;
  }
    document.getElementById("demo").innerHTML = txt;

  var videosetup;
  if (confirm("OK = true , Annuler  = false")) {
    videosetup = true;
  } else {
    videosetup = false;
  }
  document.getElementById("demo2").innerHTML = txt2;

  

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: audiosetup,
  offerToReceiveVideo: videosetup
};

/////////////////////////////////////////////

var room = 'foo';

var socket = io.connect();

  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);

socket.on('created', function(room) {
	console.log('Created room ' + room),
	isInitiator = true
})

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full'),
  hangup();
})

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room),
  console.log('This peer is the initiator of room ' + room + '!'),
  isChannelReady = true
})

socket.on('joined', function(room) {
  console.log('joined: ' + room),
  isChannelReady = true
})

socket.on('log', function(array) {
  console.log.apply(console, array)
})

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message),
  socket.emit('message', message)
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate,
    })
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    hangup();
  }
})

////////////////////////////////////////////////////
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var button = document.querySelector('#button');
if (button) {
button.addEventListener('click', updateBtn);
}
var bouton = document.querySelector('#bouton');
if (bouton) {
	bouton.addEventListener('click', updateBouton);
}

var constraints = {
      audio: true,
      video: {facingMode : 'environment'} 
	  }
	  
function updateBtn() {
  if (button.value === 'Stopper webcam') {
    document.getElementById("button").addEventListener("click", function(event) {
		pc.removeStream(localVideo)
	console.log('stop');
}, false);
}
}
	
function updateBouton() {
  if (button.value === 'Start webcam') {
    document.getElementById("bouton").addEventListener("click", function(event) {
	pc.addStream(localVideo);
	console.log('go');
}, false);
}
}


navigator.mediaDevices.getUserMedia({
  audio: true,
  video: {facingMode : 'environment'} 
  })

.then(gotStream)
.catch(function(e) {
	alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

console.log('Getting user media with constraints', constraints);


function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    if (location.hostname !== 'localhost') {
  pc = new RTCPeerConnection(pcConfig);
} else {
  pc = new RTCPeerConnection(null);
} 
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.')
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from :
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer)
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
  
}

function stop() {	
  isStarted = false;
  pc.close();
  pc = null;
}