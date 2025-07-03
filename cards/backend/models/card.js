const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Create Schema
const CardSchema = new Schema({
    userId: {
        type: Number
    },
    card: {
        type: String,
        required: true
    }
});
module.exports = Card = mongoose.model('Cards', CardSchema);