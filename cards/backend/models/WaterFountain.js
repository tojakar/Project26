const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//Create Schema
const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    xCoord: {
        type: Number,
        required: true,
    },
    yCoord: {
        type: Number,
        required: true
    },
    filterLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
        default: 0
    },
});
module.exports = user = mongoose.model("WaterFountain", UserSchema);