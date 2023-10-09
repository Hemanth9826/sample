const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { PubSub } = require('@google-cloud/pubsub');
const jsforce = require('jsforce');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Google Cloud Pub/Sub configuration
const pubsub = new PubSub();
const subscriptionName = 'your-subscription-name';
const subscription = pubsub.subscription(subscriptionName);

// Salesforce configuration
const sfUsername = 'your-salesforce-username';
const sfPassword = 'your-salesforce-password';
const sfSecurityToken = 'your-salesforce-security-token';
const conn = new jsforce.Connection();

// Express.js routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  subscription.on('message', (message) => {
    // Handle the incoming Pub/Sub message here.
    const messageData = message.data.toString();
    io.emit('message', messageData);

    // Update Salesforce (example: create a lead)
    conn.login(sfUsername, sfPassword + sfSecurityToken, (err, userInfo) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Logged in as ${userInfo.id}`);
        const lead = { FirstName: 'John', LastName: 'Doe', Company: 'Example Inc' };
        conn.sobject('Lead').create(lead, (err, ret) => {
          if (err || !ret.success) {
            console.error(err || ret);
          } else {
            console.log(`Created Salesforce Lead ID: ${ret.id}`);
          }
        });
      }
    });

    message.ack();
  });
});

server.listen(6060, () => {
  console.log('Server listening on port 6060');
});
