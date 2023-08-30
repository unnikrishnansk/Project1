const userCollection = require("../model/userModel");
const userController = require("../controllers/userController");


const isLogin = async (req, res, next) => {
    try {
      if (req.session.user1) {
        next();
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // const isOtpLogout = async (req, res, next) => {
  //   try {
  //     if (req.session.user1) {
  //       res.redirect("/homepage");
  //     } 
  //     // else if (req.session.admin_id) {
  //     //   res.redirect('/admin/adminhomepage');
  //     // }
  //     else {
  //       next();
  //     }
  //   } catch (error) {
  //     console.log(error.message);
  //   }
  // };
  
  const isLogout = async (req, res, next) => {
    try {
      if (req.session.user1) {
        res.redirect("/homepage");
      } 
      // else if (req.session.admin_id) {
      //   res.redirect('/admin/adminhomepage');
      // }
      else {
        next();
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const isblock = async (req,res,next) => {
    const check = await userCollection.findOne({ username: req.session.user });
    if(check.isblocked == false){
      next();
    }
    else{
      res.render('login',{message:"User is blocked"})
    }
  }
  
  module.exports = {
    isLogin,
    isLogout,
    isblock,
  };
  