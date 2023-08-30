const mongoose = require('mongoose');

// mongoose.connect("mongodb://localhost:27017/buyzoneregister")
// .then(()=>{
//     console.log("mongodb connected")
// })
// .catch(() => {
//     console.log("connection failed");
// });



const loginSchema = new mongoose.Schema({
    adminemail : {
        type : String,
        required : true
    },
    adminname : {
        type : String,
        required : true
    },
    adminpassword : {
        type : String,
        required : true
    }
})

const adminCollection = new mongoose.model("admindatas",loginSchema);


module.exports = adminCollection
