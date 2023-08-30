const mongoose = require('mongoose');
const productModel = require('./productModel');

// mongoose.connect("mongodb://localhost:27017/buyzoneregister")
// .then(()=>{
//     console.log("mongodb connected")
// })
// .catch(() => {
//     console.log("connection failed");
// });


// user collection 

const signupSchema = new mongoose.Schema({
    userid : {
        type : String,
        // required : true/
    },
    name : {
        type : String,
        required : true
    },
    profilImage:{
        type : String,
        default : "nill"
    },
    username : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    mobile : {
        type : Number,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    isblocked : {
        type : Boolean,
        required : true,
        default : false
    },
    cart: {
        items: [{
            productId: {
                type: String,
                ref: productModel
            },
            quantity: {
                type: Number,
                default: 1
            },
            name:{
                type: String,
                require: true
            },
            stock:{
                type: Number,
                require: true
            },
            price: {
                type: Number,
                require: true
            },
            prodImage:{
                type: String,
                require :true
            }
        }]
    },
    wish: {
        items: [{
            productId: {
                type: String,
                ref: productModel
            },
            name:{
                type: String,
                require: true
            },
            price: {
                type: Number,
                require: true
            },
            prodImage:{
                type: String,
                require :true
            }
        }]
    },
    address :{
        type : Array,
    }
})

const usercollection = new mongoose.model("registerdata",signupSchema);

module.exports = usercollection;
