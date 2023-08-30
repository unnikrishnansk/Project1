const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
        bannerID :{
            type : String,
            required : true
        },
        bannerName :{
            type : String,
            required : true
        },
        bannerNavigate :{
            type : String,
            required : true
        },
        bannerDescription :{
            type : String,
            required : true
        },
        bannerImage:{
            type : String,
            required : true
        }
})

 const bannerCollection = new mongoose.model("bannerdata",bannerSchema);


module.exports = bannerCollection;


