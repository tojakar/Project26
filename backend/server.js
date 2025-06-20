
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb'); // MongoDB driver
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});

// MongoDB setup
const url = 'mongodb+srv://02kmtellez:COP4331@largeproject.rttsyvo.mongodb.net/'
const client = new MongoClient(url);

// Connect to MongoDB before starting the server
client.connect()
  .then(() => {
    console.log("Connected to MongoDB");

    const db = client.db('LargeProject');

    // Example route that uses the DB
    app.post('/api/login', async (req, res) => {
        const { login, password } = req.body;
        const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();

        if (results.length > 0) {
            res.status(200).json({
                id: results[0].UserID,
                firstName: results[0].FirstName,
                lastName: results[0].LastName,
                error: ''
            });
        } else {
            res.status(200).json({ id: -1, error: 'Invalid login' });
        }
    });

    // Now start the server
    app.listen(5000, () => {
        console.log('Server is running on port 5000');
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
