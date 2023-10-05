const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Connection, PlatformEventSubscription } = require('jsforce');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Salesforce connection
const conn = new Connection({
  loginUrl: 'https://login.salesforce.com',
  accessToken: 'YOUR_ACCESS_TOKEN', // Replace with your Salesforce access token
});

// Connect to Salesforce and subscribe to the Platform Event
conn.login()
  .then(() => {
    const subscription = conn.streaming.topic('AccountCreatedEvent').subscribe(
      (message) => {
        const accountName = message.sobject.AccountName__c;
        io.emit('newAccount', { accountName });
      }
    );

    // Handle disconnects and errors
    subscription.on('error', (error) => {
      console.error('Error:', error);
    });

    subscription.on('disconnect', () => {
      console.log('Disconnected from Salesforce');
    });
  })
  .catch((error) => {
    console.error('Salesforce login error:', error);
  });

// Serve static files or set up routes as needed

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
