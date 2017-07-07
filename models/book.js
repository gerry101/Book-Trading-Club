var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
   name: {
       type: String,
       unique: true
   },
   image: String,
   author: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User'
   },
   authorName: String,
   link: String,
   date: {
       type: Date,
       default: Date.now
   }
});

module.exports = mongoose.model('Book', bookSchema);