const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RatingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fountainId: { type: Schema.Types.ObjectId, ref: 'WaterFountain', required: true },
  rating: { type: Number, required: true },
}, { timestamps: true });

RatingSchema.index({ userId: 1, fountainId: 1 }, { unique: true }); // Prevent duplicate ratings per user/fountain

module.exports = mongoose.model('Rating', RatingSchema);
