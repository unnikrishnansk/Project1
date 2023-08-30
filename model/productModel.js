const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
        productID :{
            type : String,
            required : true
        },
        productName :{
            type : String,
            required : true
        },
        productPrice :{
            type : Number,
            required : true
        },
        productStock :{
            type : Number,
            required : true
        },
        productDescription :{
            type : String,
            required : true
        },
        mainImage:{
            type:String,
            require:true
        },
        image:[{
            type: String,
            require: true
        }],
        productCategory :{
            type : String,
            required : true
        }
})

 const productCollection = new mongoose.model("productdata",productSchema);


module.exports = productCollection;


