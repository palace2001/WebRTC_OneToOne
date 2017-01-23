var HTTP_PORT = 3030;
var fs = require('fs');
var http = require('http');
var wolfram = require
var WebSocketServer = require('ws').Server;
var wolfram = require('wolfram-alpha').createClient("QW8J45-V6Y3X7HTHX");


// wolfram.query("integrate 2x", function (err, result) {
//   if (err) throw err;
//   console.log("Result: %j", result);
// });


// Create a server for the client html page
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url + "\n");
};

var httpServer = http.createServer(handleRequest);
httpServer.listen(HTTP_PORT);


// Create a server for handling websocket calls
var wss = new WebSocketServer({server: httpServer});

wss.on('connection', function(ws) {
    console.log('websocket connection open');
    ws.on('message', function(message) {
        // Broadcast any received message to all clients
        console.log(' received m: %s', message + "\n");
        wolfram.query(message, function (err, result) {
            if (err) throw err;
            // console.log(" Result0: %j  \n", result[0]);
            // console.log(" Result1: %j  \n", result[1]);
            // console.log("title : ", + JSON.parse( '{ '+ result + ' }').title);
            // wss.broadcast(JSON.parse(result[0]));
            // for(var i in wss.clients) 
            wss.clients[0].send(JSON.stringify(result));
            console.log("broadcast to [client " + 0 + "], " + " send : " + JSON.stringify(result) + "\n");   
        });   
    });
});

// wss.broadcast = function(data) {
//     for(var i in this.clients) {
//         this.clients[i].send(data);
//         console.log("broadcast to [client " + i + "], " + " send : " + data + "\n\n");
//     }
// };


console.log('Server running. Visit https://localhost:' + HTTP_PORT);
