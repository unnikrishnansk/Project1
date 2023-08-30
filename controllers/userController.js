const categoryCollection = require('../model/categoryModel');
const productCollection = require('../model/productModel');
const userCollection = require('../model/userModel');
const bannerCollection = require('../model/bannerModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
// var tooltip = require('tooltip')
const couponCollection = require('../model/couponModel');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const dotenv = require('dotenv');
const ordercollection = require('../model/orderModel');
dotenv.config();

const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;
const razorpayId = process.env.RAZORPAY_ID_KEY;
const razorpaySecretKey = process.env.RAZORPAY_SECRET_KEY;

const client = require('twilio')(accountSid, authToken);


function generateIds() {
  const digits = "0123456789";
  let id = "";

  for (let i = 0; i < 6; i++) {
    id += digits[Math.floor(Math.random() * 10)];
  }
  return id;
}

// random id creation
function generateIds() {
  const digits = "0123456789";
  let id = "";

  for (let i = 0; i < 6; i++) {
    id += digits[Math.floor(Math.random() * 10)];
  }
  return id;
}

const loadRegister = (req, res) => {
  try {
    res.render('register');
  }
  catch (err) {
    console.log(err.message);
    res.render('404error');
  }
}

// otp functionalities

let otp = [];
const loadOtp = (req, res) => {
  try {
    otp = generateOTP(6);
    sendTextMessage(otp);
    res.render('otp');
  }
  catch (err) {
    console.log(err.message);
    res.render('404error');
  }
}

const verifyOtp = (req, res) => {
  try {
    let { first, second, third, fourth, fifth, sixth } = req.body;
    let [first1, second1, third1, fourth1, fifth1, sixth1] = otp;
    if (first == first1 && second == second1 && third == third1 && fourth == fourth1 && fifth == fifth1 && sixth == sixth1) {
      res.redirect('/homepage');
    }
    else {
      res.render('otp', { message: "Otp verification failed" })
    }
  }
  catch (err) {
    console.log(err.message)
    res.render('404error');
  }
}

// OTP MANAGEMENT

// GENERATE OTP 

function generateOTP(length) {
  var otp = '';
  for (var i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

// SEND OTP SMS TO MOBILE NUMBER USING TWILIO

function sendTextMessage(otp) {

  client.messages.create({
    body: `<#> ${otp} is your Mybuzz verification code. Enjoy shopping!`,
    to: '+918075180897', // Text your number
    from: '+16186680690', // From a valid Twilio number
  })
    .then((message) => console.log(message))
    .catch(err => console.log(err));
}

// secure password

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  }
  catch (error) {
    console.log(error.message)
  }
}


const verifyRegister = async (req, res) => {
  try {
    let flag = false;
    const checkname = await userCollection.findOne({ $or: [{ name: req.body.name }, { email: req.body.email }] });
    if (checkname !== null) flag = true;
    if (!flag) {
      const randromId = generateIds();
      const userid = "CUS" + randromId;
      const securepassword = await securePassword(req.body.password);
      const data = {
        userid: userid,
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        mobile: req.body.mobile,
        password: securepassword,
      };
      await userCollection.insertMany([data]);
      res.redirect("/otp");
    }
    else {
      res.render('register', { message: "Username or Email already exists" });
    }
  }
  catch (err) {
    console.log(err.message);
    res.render('404error');
  }
}

const loadHomepage = async (req, res) => {
  try {
    if (req.session.user) {
      const categorydetails = await categoryCollection.find({});
      const user = await userCollection.findOne({ username: req.session.user }, { cart: 1 ,wish:1});
      const cartData = user.cart.items;
      let cartcount = cartData.length;
      const wishData = user.wish.items;
      let wishcount = wishData.length;
      let banner = await bannerCollection.find({});
      res.render('homepage', { categorydetails, user: req.session.user, cartcount,banner,wishcount});
    }
  }
  catch (err) {
    console.log(err.message);
    res.render('404error');
  }
}

const loadLogin = (req, res) => {
  try {
    res.render('login');
  }
  catch (err) {
    console.log(err.message);
    res.render('404error');
  }
}

const verifyLogin = async (req, res) => {
  try {
    const check = await userCollection.findOne({ username: req.body.username});
    console.log(check)
    if (check == null) {
      res.render('login', { message: "Invalid username" })
    }else if(check != null && check.isblocked == true){
      res.render('login', { message: "User is blocked" })
    }
    else{
    const password = req.body.password;
    const passwordMatch = await bcrypt.compare(password, check.password)
    if (passwordMatch) {
      req.session.user = check.username;
      req.session.user1 = true
      console.log(req.s)
      res.redirect("/homepage");
    } else {
      res.render("login", { message: "Invalid password" });
    }
  }
  } catch (err) {
    console.log(err)
    res.render("404error");
  }

}

const loadproducts = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.pagesize || 4;
    const skip = (page - 1) * limit;
    const name = req.query.name;
    const categoryData = await categoryCollection.find({},{categoryName:1});
    const productdetails = await productCollection.find({ productCategory: name }).skip(skip).limit(limit);
    let category = productdetails[0].productCategory || "";
    let countpages = Math.ceil(productdetails.length / limit);
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1 ,wish:1});
    const cartData = user.cart.items;
    let cartcount = cartData.length;
    const wishData = user.wish.items;
      let wishcount = wishData.length;
    res.render('userProducts', { productdetails, page, limit, category, countpages, cartcount ,wishcount,categoryData,user: req.session.user});
  }
  catch (err) {
    console.log(err.message);
    res.render('404error');
  }
}

const loadSingleproduct = async (req, res) => {
  try {
    const id = req.query.id;
    const singleproduct = await productCollection.find({ productID: id });
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1,wish:1 });
    const cartData = user.cart.items;
    let cartcount = cartData.length;
    const wishData = user.wish.items;
      let wishcount = wishData.length;
    res.render('singleProduct', { singleproduct, cartcount,wishcount, user: req.session.user });
  }
  catch (err) {
    console.log(err.message)
    res.render('404error');
  }
}

const logout = (req, res) => {
  try {
    req.session.destroy(function (err) {
      if (err) {
        res.send("Error");
      } else {
        res.redirect("/")
      }
    });
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const userSearchproducts = async (req, res) => {
  try {
    let search = req.query.searchdata;
    console.log(search);

    const searchQuery = {
      $or: [
        { productName: { $regex: '^' + search } },
        { productCategory: { $regex: '^' + search } }
      ]
    };

    // Execute the find query on the collection
    const searchedproduct = await productCollection.find({
      $or: [
        { productName: { $regex: search,$options: 'i'  } },
        { productCategory: { $regex: search,$options: 'i'  } }
      ]
    });

    let items = searchedproduct.length;
    console.log(searchedproduct)
    const categoryData = await categoryCollection.find({},{categoryName:1});

    if (searchedproduct == "") {
      res.render("userSearch", { message: "Searched item doesnot exist", productdetails: searchedproduct, items,categoryData,user: req.session.user })
    }
    else {
      res.render("userSearch", { title: "Admin System", productdetails: searchedproduct, items, search,categoryData,user: req.session.user })
    }
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const addToBag = async (req, res) => {
  console.log("in add to bag>> ", req.query)
  try {
    if (req.session.user) {
      const productData = await productCollection.findOne({ productID: req.query.id });
      const userData = await userCollection.findOne({ username: req.session.user });
      const cartItems = userData.cart.items;
      const existingCartItem = cartItems.find(item => item.productId.toString() === req.query.id);
      if (existingCartItem) {
        console.log("exists");
        res.send(JSON.stringify("exists"));
      } else {
        const cartData = {
          productId: req.query.id,
          price: productData.productPrice,
          name: productData.productName,
          stock: productData.productStock,
          prodImage: productData.mainImage,
        };
        console.log(cartData)
        userData.cart.items.push(cartData);
        const cart = await userData.save();
        console.log(cart);
        if (cart) {
          res.send(JSON.stringify(cart))
        } else {
          res.send(JSON.stringify("error"));
        }
      }
    } else {

      res.send(JSON.stringify("login"))
    }
  } catch (err) {
    console.log("in addto bag>> ", err.message);
    res.render('404error');
  }
}

const addToWish = async (req,res) => {
  try{
    if (req.session.user) {
      console.log(req.query.id)
      const productData = await productCollection.findOne({ productID: req.query.id });
      console.log(productData)
      const userData = await userCollection.findOne({ username: req.session.user });
      console.log(userData)
      const wishItems = userData.wish.items;
      const existingWishItem = wishItems.find(item => item.productId.toString() === req.query.id);
      if (existingWishItem) {
        console.log("exists");
        res.send(JSON.stringify("exists"));
      } else {
        const wishData = {
          productId: req.query.id,
          price: productData.productPrice,
          name: productData.productName,
          prodImage: productData.mainImage,
        };
        console.log(wishData)
        userData.wish.items.push(wishData);
        const wish = await userData.save();
        console.log(wish);
        if (wish) {
          res.send(JSON.stringify(wish))
        } else {
          res.send(JSON.stringify("error"));
        }
      }
    } else {

      res.send(JSON.stringify("login"))
    }
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const loadWish = async (req,res) => {
  try{
    const user = await userCollection.findOne({ username: req.session.user }, { wish: 1 ,cart : 1});

    const wishData = user.wish.items;
    let wishcount = wishData.length;
    const cartData = user.cart.items;
    let cartcount = cartData.length;
    console.log(wishcount);
    res.render('wishlist', { wishData, wishcount, cartcount, user: req.session.user  });
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const loadCart = async (req, res) => {
  try {
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1 ,wish:1});

    const cartData = user.cart.items;
    let cartcount = cartData.length;
    const wishData = user.wish.items;
      let wishcount = wishData.length;
    res.render('cart', { cartData, cartcount,user: req.session.user  });

  }
  catch (err) {
    console.log(err)
    res.render('404error');
  }
}

const updateQuantity = async (req, res) => {
  try {
    const prodId = req.body.proId;
    const qnty = req.body.count;
    const user = req.session.user;

    const result = await userCollection.updateOne(
      {
        username: user,
        "cart.items.productId": prodId
      },
      {
        $set: { "cart.items.$.quantity": qnty }
      }
    );
    res.json("success");

  } catch (err) {
    console.log("update Quantity>>", err.message);
    res.status(500).json({ error: 'An error occurred while updating the quantity.' });
  }
}

const loadshipping = async (req, res) => {
  try {
    const userdetails = await userCollection.findOne({ username: req.session.user }, { address: 1 });
    const details = userdetails.address
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1 ,wish:1});
    const cartData = user.cart.items;
    let cartcount = cartData.length;
    const wishData = user.wish.items;
      let wishcount = wishData.length;
    res.render('shippingAddress', { details, cartcount ,user: req.session.user,wishcount });
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const verifyshipping = async (req, res) => {
  try {
    
    const data = {
      addressid: uuidv4(),
      firstname: req.body.first_name,
      lastname: req.body.last_name,
      housename: req.body.house_name,
      city: req.body.city,
      state: req.body.state,
      postalcode: req.body.zip_code,
      mobile: req.body.phone_number,
      country: req.body.country,
      isdefault : false
    };
    await userCollection.updateOne({ username: req.session.user }, { $push: { address: data } });
    res.redirect('/userprofile');
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const deletecartproduct = async (req, res) => {
  try {
    const deleteproduct = req.query.product;
    console.log(req.query.product);
    const result = await userCollection.updateOne(
      { username: req.session.user },
      { $pull: { 'cart.items': { productId: deleteproduct } } }
    );
    res.redirect('/cart')
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const deletewishproduct = async (req, res) => {
  try {
    const deleteproduct = req.query.product;
    console.log(deleteproduct)
    const result = await userCollection.updateOne(
      { username: req.session.user },
      { $pull: { 'wish.items': { productId: deleteproduct } } }
    );
    res.redirect('/wishlist')
  }
  catch (err) {
    console.log(err);
    res.render('404error');
    res.render('404error');
  }
}

const movetoCart = async (req, res) => {
  try {
    const movableproduct = req.query.product;
    console.log(movableproduct);
    const userData = await userCollection.findOne({ username: req.session.user });

    const result = await userCollection.updateOne(
      { username: req.session.user },
      { $pull: { 'wish.items': { productId: movableproduct } } }
    );

    const prod = await productCollection.findOne({productID : movableproduct});
    console.log(prod)

    const Data = {
      productId: prod.productID,
      price: prod.productPrice,
      name: prod.productName,
      stock: prod.productStock,
      prodImage: prod.mainImage,
    };
    console.log(Data)
    userData.cart.items.push(Data);
    const cart = await userData.save();
    

    res.redirect('/wishlist')
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const loadeditAddress = async (req, res) => {
  try {
    let id = req.query.pass;
    const checked = await userCollection.findOne({ username: req.session.user },
      { "address": {$elemMatch : {"addressid":id}} })
    const check = checked.address;
    console.log(check)
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1 });
    const cartData = user.cart.items;
    let cartcount = cartData.length;
    res.render('editAddress', { check, cartcount,user: req.session.user  });
  }
  catch (err) {
    console.log(err.message);
    res.render('404error');
  }
}

const verifyeditaddress = async (req, res) => {
  try{
    const id = req.body.addressid;

    const result = await userCollection.updateMany({ "address.addressid": id }, {
      $set: {
        "address.$.firstname": req.body.first_name,
        "address.$.lastname": req.body.last_name,
        "address.$.housename": req.body.house_name,
        "address.$.city": req.body.city,
        "address.$.state": req.body.state,
        "address.$.postalcode": req.body.zip_code,
        "address.$.mobile": req.body.phone_number,
        "address.$.country": req.body.country,
        "address.$.isdefault": false,
      }
    });
    res.redirect("/userprofile");
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const removeAddress = async (req, res) => {
  try{
    console.log(req.query.pass);
    let id = req.query.pass;
    console.log(id)
    const result = await userCollection.updateOne(
      { username: req.session.user },
      { $pull: { address: { addressid: id } } }
    );
    res.redirect('/userprofile')
  }
  catch(err){
    res.render('404error');
  }
   
}

const loadpayment = async (req, res) => {
  try {
    req.session.users = true
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1 ,wish:1});
    const userdetails = await userCollection.findOne({ username: req.session.user }, { address: 1 });
    const details = userdetails.address
    if (user && user.cart && user.cart.items.length > 0) {
      const cartData = user.cart.items;
      let cartcount = cartData.length;
      const wishData = user.wish.items;
      let wishcount = wishData.length;
      let coupon = await couponCollection.find({couponStatus: true,isBlocked:false});;
      console.log(coupon)
      res.render('payment', { products: cartData,cartcount,wishcount,user: req.session.user,details,coupon  });
    }
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const getCoupon = async (req,res) => {
  try{
    let couponName = req.body.coupon;
    console.log("here",couponName)
    let result = await couponCollection.find({couponCode:couponName});
    let percent = result[0].couponDiscount;
    let minamnt = result[0].minPurchaseAmnt;
    let expriryres = result[0].expiryDate;
    let nowdate = new Date();
    const firstDate = new Date(expriryres);
    const secondDate = new Date(nowdate);
    if (secondDate > firstDate) {
      res.send({status:'coupon expired'})
    } else if (secondDate <= firstDate) {
      res.send({status:'coupon available',per : percent,minamnt})
    } 
   
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}


const loadordersuccess = (req, res) => {
  try {
    req.session.users = false
    console.log(req.session.users)
    if(req.session.users == false){
      res.render('orderSuccesspage');
    }else{
      res.redirect('/homepage');
    }
    
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const loadorders = async (req, res) => {
  try {

    const orders = await ordercollection.find({
      userdetails: req.session.user,
      orderstatus: { $nin: ["cancelled", "returned"] }
    }).sort({ purchaseDate: -1 });
    console.log(orders)
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1 ,wish:1});
    const cartData = user.cart.items;
    let cartcount = cartData.length;
    const wishData = user.wish.items;
      let wishcount = wishData.length;
    res.render('orderdetails', { orders, cartcount,wishcount,user: req.session.user  });
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

let data ;

const verifypayment = async (req, res) => {
  const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

  try {
    const paymentMethod=req.body.payment;
    const address = req.body.selected;
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1, username: 1 });
    const username = user.username;
    const randromId = generateIds();
    const ordid = "ORD" + randromId;
    function getDate() {
      const currentDate = new Date();
      const deliveryDate = new Date(currentDate);
      deliveryDate.setDate(deliveryDate.getDate() + 5);
      return deliveryDate;
    }

    let prods = user.cart.items;
     const orderitems = prods.map((item) => {
      console.log(item);
      return { productID: item.productId, quantity: item.quantity, price: item.price, image: item.prodImage, name: item.name };
    });
    let totalamount = parseInt(req.body.amount);

     data = {
      orderid: ordid,
      userdetails: username,
      deliveryDate: getDate(),
      paymentMethod: paymentMethod,
      orderItems: orderitems,
      addressId : address,
      totalAmount: totalamount
    };

      console.log(data)

      if(paymentMethod == 'upi'){
        const amount=parseInt(req.body.amount)*100;
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'razorUser@gmail.com'
        }
        console.log(options)

        razorpayInstance.orders.create(options,
            (err, order) => {
                if (!err) {
                    res.status(200).send({
                        method:'UPI',
                        success: true,
                        amount: amount,
                        key_id: process.env.RAZORPAY_ID_KEY,
                        contact: "8075180897",
                        name: req.session.user,
                    });
                }
              })
      }else if(paymentMethod == 'cod'){
        const user = await userCollection.findOne({ username: req.session.user }, { cart: 1, username: 1 });
        let prods = user.cart.items;
    
        for (const each of prods) {
          const productId = each.productId;
          const quantity = each.quantity;
    
          await updateProductStock(productId, quantity);
    
          async function updateProductStock(productId, quantity) {
          try {
            await productCollection.updateMany({ productID: productId }, { $inc: { productStock: -quantity } });
            console.log(`Successfully updated productStock for product with ID ${productId}`);
          } catch (error) {
            console.error(`Error updating productStock for product with ID ${productId}:`, error);
          }
        }
        }
    
        await ordercollection.insertMany([data]);
        await userCollection.updateOne(
          { username: req.session.user },
          { $unset: { "cart.items": 1 } })
          console.log("reached just above")
          
          res.status(200).send({method:'cod'})
      }
} catch (error) {
    console.log(error.message);
    res.render('404error');
}
}

const saveOrderUpi = async (req,res) => {
  try{
    console.log("inside saivng")
    console.log(data)
    const user = await userCollection.findOne({ username: req.session.user }, { cart: 1, username: 1 });
    let prods = user.cart.items;

    for (const each of prods) {
      const productId = each.productId;
      const quantity = each.quantity;

      await updateProductStock(productId, quantity);

      async function updateProductStock(productId, quantity) {
      try {
        await productCollection.updateMany({ productID: productId }, { $inc: { productStock: -quantity } });
        console.log(`Successfully updated productStock for product with ID ${productId}`);
      } catch (error) {
        console.error(`Error updating productStock for product with ID ${productId}:`, error);
      }
    }
    }

    await ordercollection.insertMany([data]);
    await userCollection.updateOne(
      { username: req.session.user },
      { $unset: { "cart.items": 1 } })
      
      res.redirect('/ordersuccess');


  }
  catch(err){
    console.log(err)
    res.render('404error');
  }
}

const cancelorderproduct = async (req, res) => {
  try{
    let id = req.query.id;
    let orderid = req.query.odr;
    const rest = await ordercollection.findOne({ orderid: orderid });
    let qnty = rest.orderItems[0].quantity;
    await ordercollection.updateOne(
      { orderid: orderid },
      { orderStatus: "cancelled" }
    );
    const prod = await productCollection.findOne({ productID: id });
    let updatqnty = prod.productStock + qnty;
    await productCollection.updateOne({ productID: id }, { productStock: updatqnty });
  
    res.redirect('/order');
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
 
}


const showFilteredproducts = async (req, res) => {
  try {
      let value = req.body.sortvalue;
      let cat = req.body.selectedcat;
      console.log(value,cat)
      const categoryData = await categoryCollection.find({},{categoryName:1});
      if(cat == "all") {
        if(value == "asc") {
            productList = await productCollection.find({}).sort({ productPrice: 1 });
        } else {
            productList = await productCollection.find({}).sort({ productPrice: 1 });
        }
    } else {
        if(value == "asc") {
            productList = await productCollection.find({productCategory: cat}).sort({ productPrice: 1 })
        } else {
            productList = await productCollection.find({productCategory: cat}).sort({ productPrice: -1 })
        }
    }
        res.render('userSearch', { productdetails:productList,categoryData});
  }
  catch (err) {
    console.log(err);
    res.render('404error');
  }
}

const returnorderproduct = async (req,res) => {
  try{
   let prodid = req.query.id;
   let orderid = req.query.odr;
    res.render('returnOrder',{prodid,orderid});
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const confirmreturnorder = async (req,res) => {
  try{
    
    const selectedOption = req.body.reasonButton;
    console.log(req.body.returnReason)
    if(!selectedOption){
      res.render('returnOrder',{message:"Enter a valid reason to return the product",prodid,orderid})
    }
    else if(selectedOption=='Other reasons' && req.body.returnReason== ""){
      res.render('returnOrder',{message:"Please provide additional details to return the product",prodid,orderid})
    }else if(selectedOption == 'product defect'){
      let prodid = req.body.prodid;
      let orderid = req.body.orderid;
      const rest = await ordercollection.findOne({ orderid: orderid });
      await ordercollection.updateOne(
      { orderid: orderid },
      {  orderStatus: "returned"  }
    );
    res.redirect('/order');
    }else{
      let prodid = req.body.prodid;
      let orderid = req.body.orderid;
      const rest = await ordercollection.findOne({ orderid: orderid });
      let qnty = rest.orderItems[0].quantity;
      await ordercollection.updateOne(
        { orderid: orderid },
        {  orderStatus: "returned"  }
      );
    const prod = await productCollection.findOne({ productID: prodid });
    let updatqnty = prod.productStock + qnty;
    await productCollection.updateOne({ productID: prodid }, { productStock: updatqnty });

  res.redirect('/order');
    }
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}


const getselectedaddress = (req,res) => {
  try{
    let selectedaddress = req.body.selected;
    console.log(selectedaddress);
    res.redirect('/payment')
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const loadUserprofile = async (req,res) => {
  try{
    console.log("hii",req.session.user)
    const userdetails = await userCollection.findOne({ username: req.session.user },{cart:1,wish:1,address:1,profilImage:1});
    console.log("hii",userdetails)
    const cartData = userdetails.cart.items;
    console.log(cartData)
    let cartcount = cartData.length;
    const wishData = userdetails.wish.items;
    console.log(wishData)
      let wishcount = wishData.length;
      let details = userdetails.address;
      console.log(details)
    const coupons = await couponCollection.find({isBlocked:false});

    res.render('userProfile',{cartcount, wishcount,user:req.session.user,userdetails,details,coupons});
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const uploadProfileimage = async (req,res) => {
  try{
    const user = req.session.user;
    console.log(user);
    const result = await userCollection.updateOne({name : user},{$set : {profilImage : req.file.filename}});
    console.log(result)
    res.redirect('/userprofile');
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const loadsingleorderdetails = async (req,res) => {
  try{
    const singleordrid = req.query.ord;
    let orders = await ordercollection.find({orderid:singleordrid});
    const ordaddress = orders[0].addressId;
    const addressdata = await userCollection.findOne({ username: req.session.user },
      { "address": {$elemMatch : {"addressid":ordaddress}} })
      console.log(addressdata.address)
      const ordadd = addressdata.address[0];
      const user = await userCollection.findOne({ username: req.session.user }, { cart: 1 ,wish:1});
      const cartData = user.cart.items;
      let cartcount = cartData.length;
      const wishData = user.wish.items;
      let wishcount = wishData.length;

    res.render('singleorderdetails',{orders,ordadd,cartcount,wishcount});
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const orderInvoice = async (req,res) => {
  try{
    let invoiceordid = req.query.id;
    let result = await ordercollection.find({orderid:invoiceordid});
    let addressid = result[0].addressId;
    const address = await userCollection.findOne({ username: req.session.user },
      { "address": {$elemMatch : {"addressid":addressid}} })
    const useraddress = address.address;
    console.log(useraddress)
    // Generate the PDF
   const doc = new PDFDocument();
   doc.pipe(fs.createWriteStream('invoice.pdf'));

   // Add content to the PDF
   console.log(result.orderid)
   doc.fontSize(15).text('BuyZone ', { align: 'center' });
   doc.fontSize(12).text('Order Invoice ', { align: 'center' });
   doc.text('--------------------------');

   doc.text(`Order Id: ${result[0].orderid}`);
   doc.text(`Order Date: ${result[0].purchaseDate}`);
   doc.text(`Payment: ${result[0].paymentMethod}`);
   doc.text('--------------------------');

   doc.text(`Name: ${useraddress[0].firstname}`);
   doc.text(`House name: ${useraddress[0].housename}`);
   doc.text(`City: ${useraddress[0].city}`);
   doc.text(`State: ${useraddress[0].state}`);
   doc.text(`PIN: ${useraddress[0].postalcode}`);
   doc.text(`Phone: ${useraddress[0].mobile}`);
   doc.text('--------------------------');

   result[0].orderItems.forEach((item) => {
    doc.text(`Product: ${item.name}`);
   
    doc.text(`Quantity: ${item.quantity}`);
    doc.text(`Amount: ${item.price}`);
    doc.text('--------------------------\n');

   doc.text('--------------------------');
  });
  doc.text(`Total Amount : ${result[0].totalAmount}`);

 // Stream the PDF to the response
 const filename = 'Invoice.pdf';
 res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
 res.setHeader('Content-Type', 'application/pdf');
 doc.pipe(res);
 doc.end();
  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}

const loadBrowsepage = async (req,res) => {
  try{
    let banner = await bannerCollection.find({});
    const productdetails = await productCollection.find({});
    res.render('browsePage',{banner,productdetails})
  }
  catch(err){
    console.log(err)
    res.render('404error');
  }
}
const userbrowseSearchproducts = async (req,res) => {
  try{
    let banner = await bannerCollection.find({});
    let search = req.query.searchdata;
    console.log(search);

    const searchedproduct = await productCollection.find({
      $or: [
        { productName: { $regex: search,$options: 'i'  } }
      ]
    });

    console.log(searchedproduct)

    if (searchedproduct == "") {
      res.render("browsePage", { message: "Searched item doesnot exist", productdetails: searchedproduct,banner})
    }
    else {
      res.render("browsePage", { title: "Admin System", productdetails: searchedproduct,banner})
    }

  }
  catch(err){
    console.log(err);
    res.render('404error');
  }
}


module.exports = {
  loadRegister,
  verifyRegister,
  loadOtp,
  verifyOtp,
  loadHomepage,
  loadLogin,
  verifyLogin,
  loadproducts,
  loadSingleproduct,
  logout,
  userSearchproducts,
  addToBag,
  loadCart,
  updateQuantity,
  loadshipping,
  deletecartproduct,
  verifyshipping,
  verifyeditaddress,
  loadeditAddress,
  removeAddress,
  loadpayment,
  loadordersuccess,
  loadorders,
  verifypayment,
  cancelorderproduct,
  showFilteredproducts,
  returnorderproduct,
  confirmreturnorder,
  getselectedaddress,
  loadUserprofile,
  addToWish,
  loadWish,
  deletewishproduct,
  movetoCart,
  uploadProfileimage,
  saveOrderUpi,
  loadsingleorderdetails,
  orderInvoice,
  getCoupon,
  loadBrowsepage,
  userbrowseSearchproducts
}