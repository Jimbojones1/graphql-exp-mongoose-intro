const mongoose = require('mongoose');


const dogSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    gender: String,
    email: String,
    age: Number,
    parents: [{firstName: String, lastName: String}]
});

export default mongoose.model('Dog', dogSchema);
