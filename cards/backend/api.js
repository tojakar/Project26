require('express');
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API);
const sender = process.env.EMAIL_SENDER;
require('mongodb');
const jwt = require("jsonwebtoken");
//load user model
const User = require("./models/user.js");
//load card model
const Card = require("./models/card.js");
//load WaterFountain model
const WaterFountain = require("./models/WaterFountain.js");
const Rating = require("./models/rating.js");
const FilterLevel = require("./models/filterLevel.js");

//hashing stuff
const bcrypt = require('bcrypt');
const { act } = require('react');
const saltRounds = 10;



async function rateFountain({ userId, fountainId, rating }) {
    let success = '';
    let error = '';
    let averageRating = 0;

    try {
        const existingRating = await Rating.findOne({ userId, fountainId });
        const fountain = await WaterFountain.findById(fountainId);
        if (!fountain) throw new Error('Fountain not found');

        if (existingRating) {
            // Update
            fountain.totalRating =
              fountain.totalRating - existingRating.rating + rating;
            // numRatings stays the same
            fountain.rating = fountain.totalRating / fountain.numRatings;
            await fountain.save();
            await Rating.updateOne({ userId, fountainId }, { rating });
            success = 'Rating updated successfully';
        } else {
            // Create
            fountain.totalRating += rating;
            fountain.numRatings += 1;
            fountain.rating = fountain.totalRating / fountain.numRatings;
            await fountain.save();
            await Rating.create({ userId, fountainId, rating });
            success = 'Rating created successfully';
        }

        // capture the new average
        averageRating = fountain.rating;
    } catch (e) {
        console.error(e);
        error = e.toString();
    }

    return { success, error, averageRating };
}


exports.setApp = function (app, client) {
    const token = require('./createJWT.js');

    

    app.post('/api/addcard', async (req, res, next) => {
        // incoming: userId, color
        // outgoing: error
        const { userId, card, jwtToken } = req.body;
        try {
            if (token.isExpired(jwtToken)) {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(401).json(r);
                return;
            }
        }
        catch (e) {
            console.log(e.message);
        }
        const newCard = new Card({ Card: card, UserId: userId });
        var error = '';
        try {
            // const db = client.db();
            // const result = db.collection('Cards').insertOne(newCard);
            newCard.save();
        }
        catch (e) {
            error = e.toString();
        }
        var refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) {
            console.log(e.message);
        }
        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });


    // incoming: email, password
    // outgoing: id, firstName, lastName, error
    app.post('/api/login', async (req, res, next) => {

        var error = '';
        const { email, password } = req.body;
        const results = await User.find({ email: email });

        //Checks if email was valid
        if (results.length === 0) {
            res.status(400).json({ error: "Email/Password incorrect" });
            return;
        }

        //Checks if the password matches
        const isMatch = await bcrypt.compare(password, results[0].password);
        if (!isMatch) {
            res.status(400).json({ error: "Email/Password incorrect" });
            return;
        }
        if (!results[0].verified){
            res.status(400).json({ error: "Please verify your email first." });
            return;
        }

        var id = -1;
        var fn = '';
        var ln = '';
        var ret;

        id = results[0]._id;
        fn = results[0].firstName;
        ln = results[0].lastName;
        try {
            const token = require("./createJWT.js");
            ret = token.createToken(fn, ln, id);
        }
        catch (e) {
            ret = { error: e.message };
        }

        res.status(200).json(ret);
    });

    // incoming: firstName, lastName, email, password
    // outgoing: message, user, error
    app.post('/api/register', async (req, res) => {
        const { firstName, lastName, email, password } = req.body;

        try {
            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                verified: false
            });

            await newUser.save();

            const tokenModule = require("./createJWT.js");
            const { accessToken } = tokenModule.createToken(firstName, lastName, newUser._id);

            const verifyURL = `http://group26.xyz/api/verify-email?token=${accessToken}`;
            const msg = {
                to: email,
                from: sender,
                subject: 'Please verify your email for Water Watch',
                html: `<p>Hello ${firstName},</p><p>Please <a href="${verifyURL}">click here</a> to verify your account.</p>`
            };

            await sgMail.send(msg);

            return res.status(200).json({
                message: 'Registration successful. Check your email to verify your account.',
                user: newUser
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/addWaterFountain', async (req, res, next) => {
        // incoming: name, description, xCoord, yCoord, filterLevel, rating, jwtToken
        // outgoing: error, success, jwtToken, addedWaterFountain

        const { name, description, xCoord, yCoord, filterLevel, rating, jwtToken } = req.body;

        // 1️⃣ Validate & decode JWT
        let userId;
        try {
            if (token.isExpired(jwtToken)) {
            return res.status(401).json({ error: 'The JWT is no longer valid', jwtToken: '' });
            }
            const jwt = require('jsonwebtoken');
            const decoded = jwt.decode(jwtToken, { complete: true });
            userId = decoded.payload.userId;
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token', jwtToken: '' });
        }

        // 2️⃣ Create fountain *without* filterLevel/rating on the doc
        const newWaterFountain = new WaterFountain({
            name,
            description,
            xCoord,
            yCoord,
            createdBy: userId,
            numRatings: 0,
            totalRating: 0,
            numFilterRatings: 0,     // if you're tracking these
            totalFilterRating: 0     // ditto
        });

        let savedWaterFountain;
        let error = '';
        let success = 'Water fountain added successfully';

        try {
            savedWaterFountain = await newWaterFountain.save();
        } catch (e) {
            error = e.toString();
        }

        // 3️⃣ If saved, immediately record both ratings via your rating functions
        if (savedWaterFountain) {
            // record star‐rating
            const rateStar = await rateFountain({
            userId,
            fountainId: savedWaterFountain._id,
            rating
            });
            if (rateStar.error) {
            error += ` | Rating error: ${rateStar.error}`;
            }

            // record filter‐level rating
            const rateFilter = await rateFilterLevel({
            userId,
            fountainId: savedWaterFountain._id,
            filterLevel
            });
            if (rateFilter.error) {
            error += ` | Filter‐level error: ${rateFilter.error}`;
            }
        }

        // 4️⃣ Refresh the JWT if needed
        let refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log('token.refresh error:', e.message);
        }
        savedWaterFountain = await WaterFountain.findById(savedWaterFountain._id);
        // 5️⃣ Return the newly created fountain
        res.status(200).json({
            success: success,
            error: error || null,
            jwtToken: refreshedToken,
            addedWaterFountain: savedWaterFountain
        });
        });
    app.post('/api/deleteWaterFountain', async (req, res, next) => {
        const { id, jwtToken } = req.body;
        let error = '';
        let success = '';

        // Step 1: Verify token
        let userId;
        try {
            if (token.isExpired(jwtToken)) {
            return res.status(401).json({ error: 'The JWT is no longer valid', jwtToken: '' });
            }

            // Decode token to get userId
            const decoded = jwt.decode(jwtToken, { complete: true });
            userId = decoded.payload.userId;
        } catch (e) {
            console.log(e.message);
            return res.status(400).json({ error: 'Invalid token', jwtToken: '' });
        }

        // Step 2: Find fountain and check ownership
        try {
            const fountain = await WaterFountain.findById(id);
            if (!fountain) {
            return res.status(404).json({ error: 'Water fountain not found', jwtToken });
            }

            if (fountain.createdBy.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized: You can only delete fountains you created.', jwtToken });
            }

            await WaterFountain.findByIdAndDelete(id);
            success = 'Water fountain deleted successfully';
        } catch (e) {
            error = e.toString();
        }

        // Step 3: Refresh token
        let refreshedToken = '';
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log(e.message);
        }

        return res.status(200).json({ success, error, jwtToken: refreshedToken });
        });

    app.post('/api/searchWaterFountainByName', async (req, res, next) => {
        // incoming: name
        // outgoing: waterFountainsFound, error, success, jwtToken
        const { name, jwtToken } = req.body;
        
        let refreshedToken = null;
        let error = '';
        let success = '';
        let waterFountainsFound = [];

        try {
            if (token.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'The JWT is no longer valid', jwtToken: '' });
            }

            waterFountainsFound = await WaterFountain.find({ name: { $regex: name + '.*', $options: 'i' } });

            if (waterFountainsFound.length > 0) {
                success = `${waterFountainsFound.length} Water fountain(s) found`;
            }
            // No error is sent if no fountains are found. An empty array is the correct response.

            refreshedToken = token.refresh(jwtToken);

        } catch (e) {
            error = e.toString();
            console.log(e.message);
        }

        const ret = { 
            found: waterFountainsFound, 
            success: success, 
            error: error, 
            jwtToken: refreshedToken 
        };
        res.status(200).json(ret);
    });

    app.post('/api/editWaterFountain', async (req, res, next) => {
        // incoming: id, editedFields, jwtToken
        // outgoing: error, success, jwtToken
        const { id, editedFields, jwtToken } = req.body;
        try {
            if (token.isExpired(jwtToken)) {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(401).json(r);
                return;
            }
        }
        catch (e) {
            console.log(e.message);
        }
        var error = '';
        var success = '';
        try {
            const updatedWaterFountain = await WaterFountain.findByIdAndUpdate(id, editedFields, { new: true });
            if (!updatedWaterFountain) {
                error = "Water fountain not found";
                res.status(404).json({ error: error, jwtToken: jwtToken });
                return;
            }
            success = "Water fountain updated successfully";
        }
        catch (e) {
            error = e.toString();
        }
        var refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) {
            console.log(e.message);
        }
        var ret = { error: error, success: success, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    app.post('/api/getAllWaterFountains', async (req, res, next) => {
        // incoming: jwtToken
        // outgoing: error, success, jwtToken, allWaterFountains[]
        // allWaterFountains is an array of all water fountains in the database
        const { jwtToken } = req.body;
        try {
            if (token.isExpired(jwtToken)) {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(401).json(r);
                return;
            }
        }
        catch (e) {
            console.log(e.message);
        }
        var error = '';
        var success = '';
        let allWaterFountains = [];
        try {
            allWaterFountains = await WaterFountain.find({});
            if (!allWaterFountains) {
                error = "No water fountains found";
                res.status(404).json({ error: error, jwtToken: jwtToken });
                return;
            }
            success = "Water fountains retrieved successfully";
        }
        catch (e) {
            error = e.toString();
            res.status(404).json({ error: error, jwtToken: jwtToken });
            return;
        }

        var refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) {
            console.log(e.message);
            res.status(404).json({ error: error, jwtToken: jwtToken });
            return
        }


        var ret = { allWaterFountains: allWaterFountains, success: success, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    app.post('/api/rateWaterFountain', async (req, res) => {
        const { userId, fountainId, rating, jwtToken } = req.body;

        try {
            if (token.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'JWT expired', jwtToken: '' });
            }
        } catch (e) {
            console.log(e.message);
        }

        let { success, error, averageRating } = await rateFountain({ userId, fountainId, rating });

        let refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log(e.message);
        }

        res.status(200).json({ error, success, averageRating, jwtToken: refreshedToken });
    });

    //get user ratings
    app.post('/api/getUserRating', async (req, res) => {
        const { userId, fountainId, jwtToken } = req.body;

        try {
            if (token.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'JWT expired', jwtToken: '' });
            }
        } catch (e) {
            console.log(e.message);
        }

        let error = '';
        let userRating = null;
        let refreshedToken = null;

        try {
            userRating = await Rating.findOne({ userId, fountainId });
        } catch (e) {
            error = e.toString();
        }

        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log(e.message);
        }

        res.status(200).json({ rating: userRating?.rating || null, error, jwtToken: refreshedToken });
    });
    app.get('/api/verify-email', async(req, res) =>{
        const verify_token = req.query.token;
        if (!verify_token) {
            return res.status(400).send("Missing token.");
        }
        if (token.isExpired(verify_token))
        {
            return res.status(400).send("Token expired");
        }

        const jwt = require("jsonwebtoken");
        let decoded;
        try {
            decoded = jwt.verify(verify_token, process.env.ACCESS_TOKEN_SECRET);
        } catch (err){
            return res.status(400).send("Invalid token.");
        }
        try {
            const user = await User.findById(decoded.userId);
            if (!user)
            {
                return res.status(404).send("User not found.");
            }
            if (user.verified)
            {
                return res.status(200).send("Email already verified.");
            }
            user.verified = true;
            await user.save();
            return res.status(200).send("Email verified successfully.");

        } catch (err)
        {
            return res.status(500).send("Server error.");
        }

    });

    async function rateFilterLevel({ userId, fountainId, filterLevel }) {
        let success = '';
        let error = '';
        let averageFilterLevel = 0;

        try {
            const existing = await FilterLevel.findOne({ userId, fountainId });
            const fountain = await WaterFountain.findById(fountainId);
            if (!fountain) throw new Error('Fountain not found');

            if (existing) {
            // Update existing
            fountain.totalFilterLevel =
                fountain.totalFilterLevel - existing.filterLevel + filterLevel;
            await FilterLevel.updateOne({ userId, fountainId }, { filterLevel });
            } else {
            // New rating
            fountain.totalFilterLevel += filterLevel;
            fountain.numFilterRatings += 1;
            await FilterLevel.create({ userId, fountainId, filterLevel });
            }

            // Compute and persist average
            fountain.filterLevel = fountain.totalFilterLevel / fountain.numFilterRatings;
            await fountain.save();

            // Capture it for the response
            averageFilterLevel = fountain.filterLevel;
            success = 'Filter level rating saved';
        } catch (e) {
            console.error(e);
            error = e.toString();
        }

        return { success, error, averageFilterLevel };
        }

    app.post('/api/rateFilterLevel', async (req, res) => {
        const { userId, fountainId, filterLevel, jwtToken } = req.body;

        try {
            if (token.isExpired(jwtToken)) {
            return res.status(401).json({ error: 'JWT expired', jwtToken: '' });
            }
        } catch (e) {
            return res.status(500).json({ error: 'Invalid token' });
        }

        const { success, error, averageFilterLevel } = await rateFilterLevel({ userId, fountainId, filterLevel });

        let refreshedToken = '';
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log(e.message);
        }

        res.status(200).json({ success, error, averageFilterLevel, jwtToken: refreshedToken });
        });

        app.post('/api/getUserFilterLevel', async (req, res) => {
            const { userId, fountainId, jwtToken } = req.body;

            try {
                if (token.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'JWT expired', jwtToken: '' });
                }
            } catch (e) {
                return res.status(500).json({ error: 'Invalid token' });
            }

            let error = '';
            let filterLevel = null;
            try {
                const rating = await FilterLevel.findOne({ userId, fountainId });
                filterLevel = rating?.filterLevel || null;
            } catch (e) {
                error = e.toString();
            }

            let refreshedToken = '';
            try {
                refreshedToken = token.refresh(jwtToken);
            } catch (e) {
                console.log(e.message);
            }

            res.status(200).json({ filterLevel, error, jwtToken: refreshedToken, });
            });
    app.post('/api/passResetEmail', async(req, res) =>{
        const { email } = req.body;
        try {
            const user = await User.findOne({email: email});
            if (!user)
            {return res.status(404).json({error: "User with this email not found"});}


            const tokenModule = require("./createJWT.js");
            const { accessToken } = tokenModule.createToken(user.firstName, user.lastName, user._id);
            const passResetURL = `http://group26.xyz/forgot-password?token=${accessToken}&id=${user._id}`;

            const msg = {
                to: email,
                from: sender,
                subject: 'Password reset for Water Watch',
                html:`<p>Hello ${user.firstName},</p><p>Please <a href="${passResetURL}">click here</a> to reset your password.</p>`
            };

            await sgMail.send(msg);

            return res.status(200).json({message: 'Please check your email for the password reset email.'});

        } catch (err){
            console.error(err);
            return res.status(500).json({error: err.message});
        }
    });
    app.post('/api/passReset', async (req, res) =>{
        const {token: passToken, newPassword} = req.body;
        if (!passToken||!newPassword)
        {
            return res.status(400).json({error: "Missing required fields"});
        }
        if (token.isExpired(passToken))
        {
            return res.status(400).send("Token expired.");
        }
        const jwt = require("jsonwebtoken");
        let decoded;
        try {
            decoded = jwt.verify(passToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId);
            if (!user)
            {
                return res.status(404).json({error: "User not found"});
            }

            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({message: "Password reset successful"});
        } catch (err){
            console.error(err);
            return res.status(400).json({error: err.message});
        }
    });
}


