const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FilterLevelSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fountainId: { type: Schema.Types.ObjectId, ref: 'WaterFountain', required: true },
  filterLevel: { type: Number, required: true, min: 1, max: 3 }
}, { timestamps: true });

FilterLevelSchema.index({ userId: 1, fountainId: 1 }, { unique: true });

module.exports = mongoose.model('FilterLevel', FilterLevelSchema);