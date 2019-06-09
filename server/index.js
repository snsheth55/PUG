const express = require('express');
const path = require('path');
const urltest = require('url');
const querystring = require('querystring');
const bodyParser = require("body-parser");
const pino = require('express-pino-logger')();

const app = express();
app.use(pino);

global.window = new Object(); //this is required to exist bc of a dependency in @stomp\stompjs\bundles\stomp.umd.js. It has no purpose here.
global.TextEncoder = require('text-encoder').TextEncoder;
global.TextDecoder = require('text-encoder').TextDecoder;
global.WebSocket = require('websocket').w3cwebsocket;
global.StompJs = require('@stomp/stompjs');

app.use(express.static(path.join(__dirname, 'client/build')));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

function sendCommandToPUG(PUG_Action, PUG_ObjectClass, PUG_RequestData, stompClient) {
    console.log("sendMessage()");
    /* the following message structure is required by PUG to service your request. */
    messageBody = {
        caller_context : {
            identifier: {
                'user_id' : "01C78812-C26C-41F4-A436-E420DFC9CF3A", //This is the requestor's PUG User_ID
                'sessionid' : "02938012380912830192381" // Undefined at the moment, but, required. Add any value for now
            },
            'web-session' : {
                'server' : "2938012398012938" // Unenforced for now. This will become the web session-id
            }
        },
        request:
            PUG_RequestData
    }

    stompClient.publish( {
        destination:    '/queue/statemanager',
        body:           JSON.stringify(messageBody),
        headers:        {
                            'reply-to' : '/temp-queue/me',
                            'action' : PUG_Action,
                            'objectclass' : PUG_ObjectClass
                        }
    }); //publish
} //sendCommandToPUG

function getData(url, pugCommand){

  app.get(url, (req, res) => {

    console.log("URL", url)

    let parsedUrl = urltest.parse(url);
    console.log("PARSED12345", parsedUrl)
    let parsedQs = querystring.parse(parsedUrl.query);
    console.log("PARSED", parsedQs)

    stompClient = new StompJs.Client({
        connectHeaders: { login: "guest", passcode: "guest" },
        brokerURL: "ws://127.0.0.1:15674/ws",
        reconnectDelay: 200,
        debug: (str) =>  { console.log("DEBUG", str) },
        onConnect: () => { sendCommandToPUG(pugCommand[0], pugCommand[1],  pugCommand[2], stompClient); },
        onUnhandledMessage: (messageReply) => {

            reply = JSON.parse(messageReply.body);
            if(reply.status.errorOccured)
                console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

            replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
            res.json(reply);
            //stompClient.disconnect();
        },
    });
    stompClient.activate();

  });
}

getData('/api/stompTest123', ["LIST", "USERS",  { '' : ''}]);

getData('/api/userPermissionsList', ["LIST", "USER_PERMISSIONS",  { '' : ''}]);

getData('/api/getALLEndpoints', ["LIST_All", "ENDPOINTS",  { '' : ''}]);

getData('/api/getALLServiceContracts', ["LIST", "SERVICE_CONTRACTS",  { '' : ''}]);

getData('/api/getAttributes', ['LIST_USER_ATTRIBUTES_TABLE_COLUMNS', "USERS",  { '' : ''}]);

app.get('/api/Users/:name', function(req, res) {

  console.log("REQUEST>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req)

  var userName = req.params.name.replace('_', ' ');

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("GET", "USERS",  { 'display_name' : userName}, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.get('/api/Endpoints/:ed_id', function(req, res) {

  console.log("REQUEST>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req)

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("GET", "ENDPOINTS",  { "ep_id" : req.params.ed_id}, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.get('/api/Ports/:ed_id', function(req, res) {

  console.log("REQUEST>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req.params.ed_id)

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("LIST_PORTS", "ENDPOINTS",  { "ep_id" : req.params.ed_id}, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.get('/api/attributes/:attr', function(req, res) {

  var attribute = req.params.attr;

  console.log("Attribute123", attribute);

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("get_values_for_attribute", "users",  { 'user_attribute_name' : attribute}, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.get('/api/getFlags/:name', function(req, res) {

  var name = req.params.name;

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("GET", "USER_PERMISSIONS",  { 'display_name' : name}, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.get(`/api/endpointAttributeValues/:attr`, function(req, res) {

  var attribute = req.params.attr;

  console.log("Attribute123", attribute);

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("get_values_for_attribute", "endpoints",  {"attribute_name": attribute}, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.delete('/api/deleteUser/:user', function(req, res) {

  console.log("REQUEST>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req.body)

  var userName = req.params.user.replace('_', ' ');

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("DELETE", "USERS",  { 'display_name' : userName}, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.delete('/api/deleteEndpoint/:ep_id', function(req, res) {

  console.log("REQUEST>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req.body)

  var ep_id = req.params.ep_id;

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("DELETE", "ENDPOINTS",  { 'ep_id' : ep_id}, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.post(`/api/createUser`, function(req, res) {

  console.log("REQUEST>>>>>", req.body)

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("CREATE", "USERS",  req.body, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.post(`/api/createPermission`, function(req, res) {

  console.log("REQUEST>>>>>", req.body)

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("CREATE", "USER_PERMISSIONS",  req.body, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.post(`/api/createEndpoint`, function(req, res) {

  console.log("REQUEST>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req.body)

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("CREATE", "ENDPOINTS",  req.body, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.post(`/api/updateUser`, function(req, res) {

  console.log("REQUEST>>>>>", req.body)

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("UPDATE", "USERS",  req.body, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

app.post(`/api/updateEndpoint`, function(req, res) {

  console.log("REQUEST>>>>>", req.body)

  stompClient = new StompJs.Client({
      connectHeaders: { login: "guest", passcode: "guest" },
      brokerURL: "ws://127.0.0.1:15674/ws",
      reconnectDelay: 200,
      debug: (str) =>  { console.log("DEBUG", str) },
      onConnect: () => { sendCommandToPUG("UPDATE", "ENDPOINTS",  req.body, stompClient); },
      onUnhandledMessage: (messageReply) => {

          reply = JSON.parse(messageReply.body);
          if(reply.status.errorOccured)
              console.log("PUG-SERVER RETURNED ERROR: " + reply.status.errorText);

          replyData = reply.data; //here is where you will find all the data that matches your query (eg: fields/rows)
          res.json(reply);
          //stompClient.disconnect();
      },
  });

  stompClient.activate();

});

// Handles any requests that don't match the ones above
app.get('*', (req,res) => {
    res.sendFile(path.join( __dirname + '/client/build/index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port);

console.log('App is listening on port ' + port);

// const express = require('express');
// const bodyParser = require('body-parser');
// const pino = require('express-pino-logger')();
//
// const app = express();
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(pino);
//
// app.get('/api/greeting', (req, res) => {
//   const name = req.query.name || 'World';
//   res.setHeader('Content-Type', 'application/json');
//   res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
// });
//
// app.listen(3001, () =>
//   console.log('Express server is running on localhost:3001')
// );
