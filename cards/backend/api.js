require('express');
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API);
require('mongodb');
//load user model
const User = require("./models/user.js");
//load card model
const Card = require("./models/card.js");
//load WaterFountain model
const WaterFountain = require("./models/WaterFountain.js");

//hashing stuff
const bcrypt = require('bcrypt');
const waterFountain = require('./models/WaterFountain.js');
const saltRounds = 10;

exports.setApp = function ( app, client )
{
    const token = require('./createJWT.js');



    app.post('/api/addcard', async (req, res, next) =>
    {
        // incoming: userId, color
        // outgoing: error
        const { userId, card, jwtToken } = req.body;
        try
        {
        if( token.isExpired(jwtToken))
        {
        var r = {error:'The JWT is no longer valid', jwtToken: ''};
        res.status(401).json(r);
        return;
        }
        }
        catch(e)
        {
        console.log(e.message);
        }
        const newCard = new Card({ Card: card, UserId: userId });
        var error = '';
        try
        {
            // const db = client.db();
            // const result = db.collection('Cards').insertOne(newCard);
            newCard.save();
        }
        catch (e)
        {
            error = e.toString();
        }
            var refreshedToken = null;
        try
        {
        refreshedToken = token.refresh(jwtToken);
        }
        catch(e)
        {
        console.log(e.message);
        }
        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });


    // incoming: email, password
    // outgoing: id, firstName, lastName, error
    app.post('/api/login', async (req, res, next) =>
    {

        var error = '';
        const { email, password } = req.body;
        const results = await User.find({email: email});

        //Checks if email was valid
        if( results.length === 0 )
        {   
            res.status(400).json({error:"Email/Password incorrect"});
            return;
        }

        //Checks if the password matches
        const isMatch = await bcrypt.compare(password, results[0].password);
        if (!isMatch) {
            res.status(400).json({ error: "Email/Password incorrect" });
            return;
        }

        var id = -1;
        var fn = '';
        var ln = '';
        var ret;
        
        id = results[0]._id;
        fn = results[0].firstName;
        ln = results[0].lastName;
        try
        {
            const token = require("./createJWT.js");
            ret = token.createToken( fn, ln, id );
        }
        catch(e)
        {
            ret = {error:e.message};
        }
        
        res.status(200).json(ret);
    });

    // incoming: firstName, lastName, email, password
    // outgoing: message, user, error
    app.post('/api/register', async (req, res) => {

        const { firstName, lastName, email, password } = req.body;

        try {
            if(!email || !password || !firstName || !lastName) {
                return res.status(400).json({ error: 'All fields are required' });
            }
            // Check if email already exists
            const existing = await User.findOne({ email: email });
            if (existing) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUser = new User({
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: hashedPassword  //hashed password
            });

            await newUser.save();
            res.status(200).json({ message: 'User created successfully', user: newUser });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
    app.post('/api/addWaterFountain', async (req, res, next) =>
    {
        // incoming: name,description, xCoord, yCoord, filterLevel
        // outgoing: error, success, jwtToken, addedWaterFountain

        



        const { name, description, xCoord, yCoord, filterLevel, rating, jwtToken } = req.body;
        try{
            if( token.isExpired(jwtToken)){
                var r = {error:'The JWT is no longer valid', jwtToken: ''};
                res.status(401).json(r);
                return;
            }
        }
        catch(e){
            console.log(e.message);
        }
        const newWaterFountain = new waterFountain({name, description, xCoord, yCoord, filterLevel, rating});
        let savedWaterFountain;
        let error = '';
        let success = ''; 
        try{
            savedWaterFountain = await newWaterFountain.save();
            success = "Water fountain added successfully";
        }
        catch (e){
            error = e.toString();
        }
        var refreshedToken = null;
        try{
            refreshedToken = token.refresh(jwtToken);
        }
        catch(e){
            console.log(e.message);
        }
        var ret = { success: success, error: error, jwtToken: refreshedToken, addedWaterFountain: savedWaterFountain };
        res.status(200).json(ret);
    });

    app.post('/api/deleteWaterFountain', async (req, res, next) =>
    {
        // incoming: id
        // outgoing: error, success, jwtToken 
        // id is the _id of the water fountain to delete
        const { id, jwtToken } = req.body;
        try{
            if( token.isExpired(jwtToken)){
                var r = {error:'The JWT is no longer valid', jwtToken: ''};
                res.status(401).json(r);
                return;
            }
        }
        catch(e){
            console.log(e.message);
        }
        var error = '';
        var success = '';
        try{
            const deleted = await waterFountain.findByIdAndDelete(id); 
            if (!deleted) {
                error = "Water fountain not found";
                res.status(404).json({ error: error, jwtToken: jwtToken });
                return;
            }
            success = "Water fountain deleted successfully";
        }
        catch (e){
            error = e.toString();
        }
        var refreshedToken = null;
        try{
            refreshedToken = token.refresh(jwtToken);
        }
        catch(e){
            console.log(e.message);
        }
        var ret = { success: success, error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    app.post('/api/searchWaterFountainByName', async (req, res, next) =>
    {
        // incoming: name
        // outgoing: waterFountainsFound, error, success, jwtToken
        const { name, jwtToken } = req.body;
        try{
            if( token.isExpired(jwtToken)){
                var r = {error:'The JWT is no longer valid', jwtToken: ''};
                res.status(401).json(r);
                return;
            }
        }
        catch(e){
            console.log(e.message);
        }
        const waterFountainsFound = await waterFountain.find({name: {$regex: name + '.*', $options: 'i'}});
        if( waterFountainsFound.length === 0 )
        {
            res.status(404).json({error: "No water fountains found with that name", jwtToken: jwtToken});
            return;
        }
        
        var refreshedToken = null;
        try{
            refreshedToken = token.refresh(jwtToken);
        }
        catch(e){
            console.log(e.message);
        }
        success = `${waterFountainsFound.length} Water fountains found`;
        var ret = {found:waterFountainsFound, success: success, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

     app.post('/api/editWaterFountain', async (req, res, next) =>{
        // incoming: id, editedFields, jwtToken
        // outgoing: error, success, jwtToken
        const { id, editedFields, jwtToken } = req.body;
        try{
            if( token.isExpired(jwtToken)){
                var r = {error:'The JWT is no longer valid', jwtToken: ''};
                res.status(401).json(r);
                return;
            }
        }
        catch(e){
            console.log(e.message);
        }
        var error = '';
        var success = '';
        try{
            const updatedWaterFountain = await waterFountain.findByIdAndUpdate(id, editedFields, { new: true });
            if (!updatedWaterFountain) {
                error = "Water fountain not found";
                res.status(404).json({ error: error, jwtToken: jwtToken });
                return;
            }
            success = "Water fountain updated successfully";
        }
        catch (e){
            error = e.toString();
        }
        var refreshedToken = null;
        try{
            refreshedToken = token.refresh(jwtToken);
        }
        catch(e){
            console.log(e.message);
        }
        var ret = {error: error, success: success, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    app.post('/api/getAllWaterFountains', async (req, res, next) =>{
        // incoming: jwtToken
        // outgoing: error, success, jwtToken, allWaterFountains[]
        // allWaterFountains is an array of all water fountains in the database
        const { jwtToken } = req.body;
        try{
            if( token.isExpired(jwtToken)){
                var r = {error:'The JWT is no longer valid', jwtToken: ''};
                res.status(401).json(r);
                return;
            }
        }
        catch(e){
            console.log(e.message);
        }
        var error = '';
        var success = '';
        let allWaterFountains = [];
        try{
            allWaterFountains = await waterFountain.find({});
            if (!allWaterFountains) {
                error = "No water fountains found";
                res.status(404).json({ error: error, jwtToken: jwtToken });
                return;
            }
            success = "Water fountains retrieved successfully";
        }
        catch (e){
            error = e.toString();
            res.status(404).json({ error: error, jwtToken: jwtToken });
            return;
        }

        var refreshedToken = null;
        try{
            refreshedToken = token.refresh(jwtToken);
        }
        catch(e){
            console.log(e.message);
            res.status(404).json({ error: error, jwtToken: jwtToken });
            return
        }


        var ret = {allWaterFountains: allWaterFountains, success: success, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });
}

     