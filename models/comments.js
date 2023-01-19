const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  channel: {
    type: String,
    default: '',
    required: true,
  },
});

const Comments = mongoose.model('Comments', commentSchema);

module.exports = Comments;
