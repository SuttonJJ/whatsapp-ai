const path = require('path');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
require('dotenv').config({path: path.resolve(__dirname, '../.env')});

const express = require('express');
const app = express();
const port = 3000;

app.use(express.urlencoded());

app.get('/test', (req,res) => {
    res.send(`Example TEST listening on port ${port}`);
});

// Twilio Stuff
const sessions = {};

app.post('/webhook', (req, res) => {

    // Twilio response setup
    const response = new MessagingResponse();
    const message = response.message();
    res.type('text/xml');

    // Variables
    let num = req.body.From;
    // Setting up a new user into sessions
    if (!sessions[num]) {
        sessions[num] = {
            step: 0,
            name: null,
            product: null,
            area: null
        }
    }

    // Figuring out what info is still needed
    if (sessions[num].step == 0) {
        message.body('Hi! What is your name?');
        sessions[num].firstMessage = false;
        sessions[num].step++;
    }
    else if (sessions[num].name == null) {
        sessions[num].name = req.body.Body;
        sessions[num].step++;
        message.body('What is the product you would like?');
    }
    else if (sessions[num].product == null){
        sessions[num].product = req.body.Body;
        sessions[num].step++;
        message.body('Where do you stay?');
    } else if (sessions[num].area == null) {
        sessions[num].area = req.body.Body;
        sessions[num].step++;
    }

    // Responding with the details (this would be sent to a rep normally)
    if (sessions[num].step >= 4) {
        message.body(`Thanks for the info, we will get back to you shortly!
        \nName: ${sessions[num].name}\n${num}\nProduct: ${sessions[num].product}\nArea: ${sessions[num].area}`);

        sessions[num] = {
            step: 0,
            name: null,
            product: null,
            area: null
        }
    }

    console.log(sessions[num])

    res.send(response.toString());
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});