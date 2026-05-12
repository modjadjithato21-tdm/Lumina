const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  desc: String,
  price: Number,
  stock: Number,
  image: String,
  category: String
});

module.exports = mongoose.model('Product', ProductSchema);