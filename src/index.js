import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import twilio from 'twilio';
import { Ollama } from 'ollama';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { twiml: { MessagingResponse } } = twilio;

const app = express();
const port = 3000;
const sessions = {};
const ollama = new Ollama();

app.use(express.urlencoded());

app.get('/test', (req,res) => {
    res.send(`Example TEST listening on port ${port}`);
});

// Twilio Stuff
app.post('/webhookai', async (req, res) => {
    // Twilio response setup
    const response = new MessagingResponse();
    const message = response.message();
    res.type('text/xml');

    // Variables
    let num = req.body.From;

    if (!sessions[num]) {
        sessions[num] = {
            step: 0,
            name: null,
            product: null,
            area: null,
            messages: []
        }
    }

    sessions[num].messages.push({role: 'user', content: req.body.Body});

    const aiResponse = await ollama.chat({
        model: 'llama3.1',
        messages: sessions[num].messages
    });
    message.body(aiResponse.message.content)
    sessions[num].messages.push(aiResponse.message);

    res.send(response.toString());
});


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