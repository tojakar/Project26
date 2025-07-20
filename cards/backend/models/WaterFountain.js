const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WaterFountainSchema = new Schema({
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
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    numRatings: {
        type: Number,
        required: true,
        default: 0
    },
    totalRating: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("WaterFountain", WaterFountainSchema);