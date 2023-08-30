const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
     couponId:{
        type:String,
        require:true
     },
     couponCode:{
        type:String,
        require:true
     },
     expiryDate:{
        type:String,
        require:true
     },
     couponStatus:{
        type:Boolean,
        require:true,
        default:false
     },
     minPurchaseAmnt:{
        type:Number,
        require:true
     },
     couponDiscount:{
        type:Number,
        require:true
     },
     userId:{
        type:Array
     },
     isBlocked:{
      type:Boolean,
      require:true,
      default: false
     }
});

const couponModel  = mongoose.model('coupon',couponSchema);
module.exports = couponModel;