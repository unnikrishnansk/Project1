const mongoose = require('mongoose');

// order collection 

const orderSchema = new mongoose.Schema({
    orderid: {
        type: String,
        required: true
    },
    userdetails: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        required: true,
        default: "Pending"
    },
    orderItems: {
        type: Array,
        required: true
    },
    totalAmount: {
        type: Number,
    },
    purchaseDate: {
        type: Date,
        default: new Date()
    },
    deliveryDate: {
        type: Date,
    },
    paymentMethod: {
        type: String,
        required : true,
    },
    addressId : {
        type : String,
        required : true,
    }
})

const ordercollection = new mongoose.model("orderdatas", orderSchema);

module.exports = ordercollection;
