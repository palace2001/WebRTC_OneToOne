var localVideo;
var remoteVideo;
var peerConnection;
var uuid;
var serverConnection;
var c = 1;
var s = 1;






var peerConnectionConfig = {
    'iceServers': [
        {url: 'stun:52.78.180.185:3478'}
        // {url:'stun:stun01.sipphone.com'},
        // {url:'stun:stun.ekiga.net'},
        // {url:'stun:stun.fwdnet.net'},
        // {url:'stun:stun.ideasip.com'},
        // {url:'stun:stun.iptel.org'},
        // {url:'stun:stun.rixtelecom.se'},
        // {url:'stun:stun.schlund.de'},
        // {url:'stun:stun.l.google.com:19302'},
        // {url:'stun:stun1.l.google.com:19302'},
        // {url:'stun:stun2.l.google.com:19302'},
        // {url:'stun:stun3.l.google.com:19302'},
        // {url:'stun:stun4.l.google.com:19302'},
        // {url:'stun:stunserver.org'},
        // {url:'stun:stun.softjoys.com'},
        // {url:'stun:stun.voiparound.com'},
        // {url:'stun:stun.voipbuster.com'},
        // {url:'stun:stun.voipstunt.com'},
        // {url:'stun:stun.voxgratia.org'},
        // {url:'stun:stun.xten.com'},

        // {
        //     url: 'turn:numb.viagenie.ca',
        //     credential: 'muazkh',
        //     username: 'webrtc@live.com'
        // },
        // {
        //     url: 'turn:192.158.29.39:3478?transport=udp',
        //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        //     username: '28224511:1379330808'
        // },
        // {
        //     url: 'turn:192.158.29.39:3478?transport=tcp',
        //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        //     username: '28224511:1379330808'
        // }
        // {'urls': 'stun:stun.services.mozilla.com'},
        // {'urls': 'stun:stun.l.google.com:19302'}
        // {'urls': 'stun:172.31.10.40:3478'}
    ]
};



// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Update Location if Not Set
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// var urlargs = location.href +"?number=506";



// function tReady() {

//     // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
//     // Update Location if Not Set
//     // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

//     var res = location.href.split("?");
//     if (!(1 in res)) {
//         location.href =  location.href.slice(0, -1) + "?number=506";
//         return;
//     }

//     alert(location.href);
    
//     // var str = location.href + "?number=506";
//     // var res = str.split("?");

//     // alert(1 in res);


//     return;
//     // alert(res);
// 



function pageReady() {
    uuid = uuid();

    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
    // document.getElementById("hangupButton").setAttribute("disabled","disabled");


    // location.href = location.href.slice(0, -1) +"?number=506";
    // alert(location.href);


    // should have same port with server port
    serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
    serverConnection.onmessage = gotMessageFromServer;

 
    

    var constraints = {
        video: true,
        audio: true,
    };

    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
}

function call(isCaller) {
    console.log("Start Call");
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);

    if(isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
    console.log("End Call");

    // document.getElementById("callButton").setAttribute("disabled","disabled");
    // document.getElementById("hangupButton").removeAttribute("disabled");
}

function hangup(isCaller) {
    peerConnection.close();
    peerConnection = null;
    // document.getElementById("hangupButton").setAttribute("disabled","disabled");
    // document.getElementById("callButton").removeAttribute("disabled");
}


function gotMessageFromServer(message) {
    if(!peerConnection) call(false);

    var signal = JSON.parse(message.data);

    // alert(signal);

    // Ignore messages from ourself
    if(signal.uuid == uuid) return;

    if(signal.sdp) {
        
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
            // Only create answers in response to offers
            if(signal.sdp.type == 'offer') {
                console.log("sdp offer receive : " + signal + " count : " + s++);
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
            else
                console.log("sdp else receive : " + signal);
        }).catch(errorHandler);
    } else if(signal.ice) {
        console.log("ice receive : " + signal.type + " : " + signal.ice + " count : " + c++);
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

function gotIceCandidate(event) {
    if(event.candidate != null) {
        // serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
        sendMessage(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
        console.log("event candiadate is not null, To server send : ice,uuid");
    }
    console.log("got ICE candidate : " + event.candidate + "uuid :" + uuid);
}

function createdDescription(description) {
    console.log('got description');

    peerConnection.setLocalDescription(description).then(function() {
        console.log('To server send : sdp :' + JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
        // serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
        sendMessage(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
    }).catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


function sendMessage(msg) {
        waitForSocketConnection(serverConnection, function() {
            serverConnection.send(msg);
        });
    };


function waitForSocketConnection(socket, callback){
        setTimeout(
            function(){
                if (socket.readyState === 1) {
                    if(callback !== undefined){
                        callback();
                    }
                    return;
                } else {
                    waitForSocketConnection(socket,callback);
                }
            }, 5);
    };






