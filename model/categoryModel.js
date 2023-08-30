const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
        categoryID :{
            type : String,
            required : true
        },
        categoryName :{
            type : String,
            required : true
        },
        categoryDescription :{
            type : String,
            required : true
        },
        categoryImage:{
            type : String,
            required : true
        }
})

 const categoryCollection = new mongoose.model("categorydata",categorySchema);


module.exports = categoryCollection;


