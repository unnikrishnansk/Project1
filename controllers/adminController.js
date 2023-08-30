const adminCollection = require('../model/adminModel');
const userCollection = require('../model/userModel');
const categoryCollection = require('../model/categoryModel');
const productCollection = require('../model/productModel');
const { v4: uuidv4 } = require('uuid');
const ordercollection = require('../model/orderModel');
const usercollection = require('../model/userModel');
const couponCollection = require('../model/couponModel');
const sharp = require('sharp');
const path = require('path');
const bannerCollection = require('../model/bannerModel');
const PDFDocument = require('pdfkit');
const fs = require('fs');
// const filepathnamestorage = require('../router/adminRoutes')

// random id creation
function generateIds() {
  const digits = "0123456789";
  let id = "";

  for (let i = 0; i < 6; i++) {
    id += digits[Math.floor(Math.random() * 10)];
  }
  return id;
}



// load admin login page
const loadLogin = (req,res) => {
    try{
        res.render('adminLogin')
    }
    catch(err){
        console.log(err.message)
    }
}

// admin login verification
const verifyLogin = async (req,res) => {
        try{
        const check = await adminCollection.findOne({ adminname: req.body.adminname });
        if(check.adminpassword == req.body.adminpassword){
          req.session.admin_id = check._id;
            res.redirect("/admin/adminhomepage");
        } else {
            res.render("adminLogin", { message: "Invalid password" });
            }
        } catch (err) {
            console.log(err)
              res.render("adminLogin", { message: "Invalid username" });
            }
        }


// load admin homepage
const loadHomepage = async (req,res) => {
        try{
          if(req.session.admin_id){
            let totalOrders = await ordercollection.find({});
            let ordercount = totalOrders.length;
            let totalUsers = await userCollection.find().count();
            let totalProducts = await productCollection.find().count();
            let totalCategories = await categoryCollection.find().count();
            // console.log(ordercount,totalUsers,totalProducts)
            let totalDelivery = totalOrders.filter(data=>data.orderStatus==="delivered")
            let totalCancelled = totalOrders.filter(data=>data.orderStatus==="cancelled");
            let totalReturn = totalOrders.filter(data=>data.orderStatus==="returned");
            console.log("this", totalDelivery,totalCancelled,totalReturn)
            let totalSaleAmount=0;
            totalDelivery.forEach(data=>{
              console.log(data.totalAmount)
            totalSaleAmount+=parseInt( data.totalAmount);
          })
        // console.log("totalSaleAmount>>",totalSaleAmount)

        const data = {
          totalOrders:ordercount,
          totalUsers:totalUsers,
          totalProducts:totalProducts,
          totalCategories:totalCategories,
          totalDelivery:totalDelivery.length,
          totalCancelled:totalCancelled.length,
          totalReturn:totalReturn.length,
          totalSaleAmount:totalSaleAmount
        }



          res.render('adminHomepage',{data})
          }
        }
        catch(err){
                 console.log(err.message)
            }
        }

// load admin user management page        
const loadUsermanagementpage = async (req,res) => {
    try{
        const checked = await userCollection.find({});
        res.render('userManagement',{checked})
      }
      catch(err){
               console.log(err.message)
          }
      }

      // admin user search 
const searchUser = async (req,res) => {
        let searchName = req.query.search;

        const searchData = await userCollection.find({
          $or: [
            { username: { $regex: '^' + searchName } },
            { userid: { $regex: '^' + searchName } },
            { email: { $regex: '^' + searchName } }
          ]
        });

        if(searchData == ""){
          res.render("userManagement",{message : "User with this username doesnot exist",checked : searchData})
        }
        else{
          res.render("userManagement",{title : "Admin System", checked :searchData})
        }
} 

const userBlockstatus = async (req,res) => {
    let blockstatus = await userCollection.find({name : req.query.name},{isblocked: 1})
    if(blockstatus[0].isblocked == true){
        await userCollection.updateOne({name: req.query.name}, {$set : {isblocked : false}})
    } else {
        await userCollection.updateOne({name: req.query.name}, {$set : {isblocked : true}})
    }
    res.redirect('/admin/usermanagement');
}

const loadCategorypage = async (req,res) => {
    try{
        const checked = await categoryCollection.find({});
        res.render('categoryManagement',{checked});
    }
    catch(err){
        console.log(err);
    }
}

const searchCategory = async (req,res) => {
    let searchName = req.query.search;
    const searchData = await categoryCollection.find({
      $or: [
        { categoryName: { $regex: '^' + searchName } },
        { categoryID: { $regex: '^' + searchName } }
      ]
    });
    
    if(searchData == ""){
      res.render("categoryManagement",{message : "Searched category doesnot exist",checked : searchData})
    }
    else{
      res.render("categoryManagement",{title : "Admin System", checked :searchData})
    }
} 

const loadAddcategory = (req,res) => {
  try{
    res.render('addcategory');
  }
  catch(err){
    console.log(err.message);
  }
}

const verifyaddCategory = async (req,res) => {
  try{
    let flag = false;
    const checkname = await categoryCollection.findOne({$or : [{ categoryName: req.body.categoryname},{categoryID : req.body.categoryid}]});
    if(checkname !== null) flag = true;
    if(!flag){
      const randromId = generateIds();
      const catid = "CAT"+randromId;
    const data = {
      categoryID:  catid,
      categoryName: req.body.categoryname,
      categoryDescription: req.body.categorydesc,
      categoryImage : req.file.filename,
    };
    await categoryCollection.insertMany([data]);
    res.redirect("/admin/categorymanagement");
  }
  else{
    res.render('addCategory', {message: "category or category id already exists"});
  }
  }
  catch(err){
    console.log(err);
  }
}
 
const loadCategoryedit = async (req,res) => {
  try{
    let id = req.query.id;
    const check = await categoryCollection.findOne({categoryID : id});
    res.render('editCategory',{check});
  }
  catch(err){
    console.log(err.message);
  }
}

const deleteCategory  = async (req,res) => {
  try{
    let id = req.query.id;
    await categoryCollection.deleteOne({categoryID : id});
    res.redirect('/admin/categorymanagement');
  }
  catch(err) {
    console.log(err);
  }
}

const verifyeditCategory = async (req,res) => {
  const id = req.body.categoryid;
  await categoryCollection.updateOne({
    categoryID : id
  },
  {
    $set : 
    {
      categoryName: req.body.categoryname,
      categoryDescription:req.body.categorydesc,
      categoryImage:req.file.filename
    }
  });
  res.redirect("/admin/categorymanagement");

}

const loadProductpage = async (req,res) => {
  try{
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pagesize) || 10;
    const skip = (page - 1) * limit;
      const checked = await productCollection.find({}).skip(skip).limit(limit);
      let countpages = Math.ceil(checked.length / limit);
      res.render('productManagement',{checked,page,limit,countpages});
  }
  catch(err){
      console.log(err);
  }
}

const loadAddproduct = async (req,res) => {
  try{
    const categorydata = await categoryCollection.find({},{categoryName:1});
    res.render('addproduct',{categorydata});
  }
  catch(err){
    console.log(err.message);
  }
}

const verifyAddproduct = async (req,res) => {
  try{
    console.log(req.files);
    const files = req.files;
    const mainImageFile = req.files['mainImage'][0].path;

     // Crop the main image
     const croppedMainImage = await sharp(mainImageFile)
     .resize(500, 500, {
       fit: 'cover',
       position: 'top'
     })
       .toBuffer();

       // Save the cropped main image
      const mainImageFilename = `cropped-${req.files['mainImage'][0].filename}`;
      await sharp(croppedMainImage)
        .toFile(`asset/uploads/${mainImageFilename}`);

        const randromId = generateIds();
        const proid = "PRO"+randromId;

      const filenames = req.files['image'].map(file => file.filename);
    const data = {
      productID: proid,
      productName: req.body.productname,
      productPrice : req.body.productprice,
      productStock: req.body.productstock,
      productDescription: req.body.productdesc,
      mainImage:mainImageFilename,
      image: filenames,
      productCategory: req.body.selectcategory,
    };
    await productCollection.insertMany([data]);
    res.redirect('/admin/productmanagement');
}
  catch(err){
    console.log(err.message);
  }
}

const verifyEditproduct = async (req,res) => {
  
  try{
    let id = req.body.productid;
    // console.log(id);
      const filenames = req.files['image'].map(file => file.filename);
      const mainImageFile = req.files['mainImage'][0].path;
    
    const croppedMainImage = await sharp(mainImageFile)
     .resize(500, 500, {
       fit: 'cover',
       position: 'top'
     })
       .toBuffer();

       const mainImageFilename = `cropped-${req.files['mainImage'][0].filename}`;
      await sharp(croppedMainImage)
        .toFile(`asset/uploads/${mainImageFilename}`);

        // console.log(req.body)
          await productCollection.updateOne({
            productID : id
          },
          {$set : 
            {productName: req.body.productname,
            productDescription:req.body.productdetails,
            productPrice : req.body.productprice,
            productStock: req.body.productstock,
            mainImage : mainImageFilename,
            image : filenames,
            productCategory: req.body.selectcategory}
          });
        

    
    res.redirect('/admin/productmanagement');
  }
  catch(err){
    console.log(err.message);
  }
}

const searchProduct = async (req,res) => {
  let searchName = req.query.search;
  const searchData = await productCollection.find({
    $or: [
      { productName: { $regex: '^' + searchName } },
      { productID: { $regex: '^' + searchName } }
    ]
  });
  if(searchData == ""){
    res.render("productManagement",{message : "Searched product doesnot exist",checked : searchData})
  }
  else{
    res.render("productManagement",{title : "Admin System", checked :searchData})
  }
} 


const loadeditProduct = async (req,res) => {
  try{
    let id = req.query.id;
    const check = await productCollection.findOne({productID : id});
    const categorydata = await categoryCollection.find({},{categoryName:1});
    // console.log(check)
    res.render('editProduct',{check , categorydata});
  }
  catch(err){
    console.log(err.message);
  }
}

const deleteProduct = async (req,res) => {
  try{
    let id = req.query.id;
    await productCollection.deleteOne({productID : id});
    res.redirect('/admin/productmanagement');
  }
  catch(err){
    console.log(err);
  }
}

const adminlogout = async (req,res) => {
  try{
    req.session.destroy(function (err) {
      if (err) {
        res.send("Error");
      } else {
        res.redirect("/admin/adminlogin")
        console.log(req.session)
      }
    });
  }
  catch(err){
    console.log(err);
  }
}

const deleteImage = async (req,res) => {
  try{
    let deleteimage = req.query.image;
    let id = req.query.id;
   
    await productCollection.updateOne(
      { productID: id}, 
      { $pull: { image: deleteimage } } 
    );
  
    const check = await productCollection.findOne({productID : id});
    const categorydata = await categoryCollection.find({},{categoryName:1});
    res.render('editproduct',{check,categorydata});
  }
  catch(err){
    console.log(err);
  }
}

const loadOrderpage = async (req,res) => {
  try{
    const orders = await ordercollection.find({}).sort({ purchaseDate: -1 });
    console.log(orders)

    res.render('orderManagement',{orders});
  }
  catch(err){
    console.log(err);
  }
}

const verifycahngedate = async (req,res) => {
  try{
    let deliverydate = req.body.deliverydate;
    let orderid = req.query.id;
    await ordercollection.updateOne({orderid:orderid},{deliveryDate:deliverydate});
    const order = await ordercollection.findOne({orderid:orderid});
    let orders = [order];
    // console.log(orders)
    res.render('orderAdmindetails',{orders})
  }
  catch(err){
    console.log(err);
  }
}

const loadAdminorder = async (req,res) => {
  try{
    let id = req.query.id
    const order = await ordercollection.findOne({orderid:id});
    let orders = [order];
    // console.log(orders)
    res.render('orderAdmindetails',{orders})
  }
  catch(err){
    console.log(err);
  }
}

const verifychangestatus = async (req,res) => {
  try{
    let changedstatus = req.body.selectstatus;
    let orderid = req.query.id
    await ordercollection.updateOne({orderid:orderid},{orderStatus:changedstatus});
    const order = await ordercollection.findOne({orderid:orderid});
    let orders = [order];
    // console.log(orders)
    res.render('orderAdmindetails',{orders})
  }
  catch(err){
    console.log(err)
  }
}


const loadCouponmanagementpage = async (req,res) =>{
  try{
    const coupons = await couponCollection.find({isBlocked:false});
    console.log(coupons)
    res.render('couponManagement',{coupons});
  }
  catch(err){
    console.log(err)
  }
}

const loadaddCoupon = async(req,res) => {
  res.render('addcoupon');
}

const verifyaddCoupon = async (req,res) =>{
      const randromId = generateIds();
      const coupid = "COUP"+randromId;
  try{
    const data = {
      couponId: coupid,
      couponCode: req.body.couponcode,
      expiryDate: req.body.couponexpirydate,
      minPurchaseAmnt: req.body.minpurchaseamnt,
      couponDiscount: req.body.discount,
    }

    await couponCollection.insertMany([data]);
    res.redirect('/admin/couponmanagement');
  }
  catch(err){
    console.log(err)
  }
}

const discardCoupon = async (req,res) => {
  try{
    const id =req.query.couponid;
    await couponCollection.updateOne({couponId:id},{isBlocked:true});
    res.redirect('/admin/couponmanagement');
  }
  catch(err){
    console.log(err)
}
}

const editCoupon = async (req,res) => {
  try{
    const id = req.query.couponid;
    const coupon = await couponCollection.find({couponId:id});
    console.log(coupon)
    res.render('editCoupon',{coupon});
  }
  catch(err){
    console.log(err)
  }
}

const VerifyeditCoupon = async (req,res) => {
  try{
    const id = req.body.couponid;
    await couponCollection.updateOne({couponId:id},{$set: {
      couponCode: req.body.couponcode,
      expiryDate: req.body.couponexpirydate,
      minPurchaseAmnt: req.body.minpurchaseamnt,
      couponDiscount: req.body.discount,
    }});
    res.redirect('/admin/couponmanagement');
  }
  catch(err){
    console.log(err);
  }
}

const Loadlisted = async (req,res) => {
  try{
    const result = await couponCollection.find({couponStatus: true,isBlocked:false});
    console.log("here",result);
    res.render('couponManagement',{coupons:result});
  }
  catch(err){
    console.log(err);
  }
}

const changetolisted = async (req,res) => {
  try{
    const id = req.query.couponid;
    let status = await couponCollection.find({couponId:id},{couponStatus:1});
    if(status[0].couponStatus == true){
              await couponCollection.updateOne({couponId:id}, {$set : {couponStatus : false}})
          } else {
              await couponCollection.updateOne({couponId:id}, {$set : {couponStatus : true}})
          }
    console.log(status)
    res.redirect('/admin/couponmanagement');
  }
  catch(err){
    console.log(err);
  }
}

const Loadunlisted = async (req,res) => {
  try{
    const result = await couponCollection.find({couponStatus: false,isBlocked:false});
    console.log("unlisted",result);
    res.render('couponManagement',{coupons:result});
  }
  catch(err)
{
  console.log(err);
}
}

const LoadBanner = async (req,res) => {
  try{
    const banners = await bannerCollection.find({});
    res.render('bannerManagement',{banners});
  }
  catch(err){
    console.log(err);
  }
}

const LoadaddBanner = (req,res) =>{
  try{
    res.render('addBanner');
  }
  catch(err){
    console.log(err);
  }
}

const VerifyaddBanner = async (req,res) =>{
  try{
      const randromId = generateIds();
      const bannerid = "BAN"+randromId;
    const data = {
      bannerID:  bannerid,
      bannerName: req.body.bannername,
      bannerDescription: req.body.bannerdesc,
      bannerNavigate: req.body.bannernavigate,
      bannerImage : req.file.filename,
    };
    console.log(data);
    await bannerCollection.insertMany([data]);
    res.redirect("/admin/bannermanagement");
  }
  
  catch(err){
    console.log(err);
  }
}

const LoadeditBanner = async (req,res) =>{
  try{
    let bannerid = req.query.id;
    const banners = await bannerCollection.findOne({bannerID : bannerid});
    res.render('editBanner',{banners});
  }
  catch(err){
    console.log(err);
  }
}

const VerifyeditBanner = async (req,res) =>{
  try{
    const id = req.body.bannerid;
    console.log(id)
  await bannerCollection.updateOne({
    bannerID : id
  },
  {
    $set : 
    {
      bannerName: req.body.categoryname,
      bannerDescription:req.body.categorydesc,
      bannerNavigate:req.body.bannernavigate,
      bannerImage:req.file.filename
    }
  });
  res.redirect("/admin/bannermanagement");
  }
  
  catch(err){
    console.log(err);
  }
}


const searchBanner = async (req,res) => {
  try{
    let searchName = req.query.search;
  const searchData = await bannerCollection.find({
    $or: [
      { bannerName: { $regex: '^' + searchName } },
      { bannerID: { $regex: '^' + searchName } },
      { bannerDescription: { $regex: '^' + searchName } }
    ]
  });
  console.log(searchData);
  if(searchData == ""){
    res.render("bannerManagement",{message : "Searched product doesnot exist",banners : searchData})
  }
  else{
    res.render("bannerManagement",{title : "Admin System", banners :searchData})
  }
  }
  catch(err){
    console.log(err);
  }
  
} 

const deleteBanner = async (req,res) => {
  try{
    let bannerid = req.query.id;
    await bannerCollection.deleteOne({bannerID : bannerid});
    res.redirect('/admin/bannermanagement');
  }
  catch(err){
    console.log(err);
  }
}

let startofmonth;
let endofmonth;
let targetDate;
let targetYear;
const LoadReport = async (req,res) => {
  try{
    console.log("body",req.body)
    if(req.body.salesReport === "Monthly"){
        const month = req.body.month;
        console.log("month>> ",month);
         startofmonth = new Date(month);
         endofmonth = new Date(month);
        console.log("startofmonth>> ",startofmonth);
      
        endofmonth.setMonth(endofmonth.getMonth()+1);
        console.log("endofmonth>> ",endofmonth);
      
        const sales = await ordercollection.aggregate([
                {
                  $match: {
                    deliveryDate: {
                      $gte: startofmonth,
                      $lte: endofmonth
                    },
                    orderStatus: 'delivered'
                  }
                },
                {
                  $unwind: '$orderItems'
                },
                {
                  $group: {
                    _id: {
                      month: { $month: '$deliveryDate' },
                      year: { $year: '$deliveryDate' },
                      orderId: '$orderid'
                    },
                    productNames: { $push: '$orderItems.name' },
                    // category: { $push: '$orderItems.category' },
                    quantity: { $sum: '$orderItems.quantity' },
                    amount: { $first: '$totalAmount' } // Extract the amount from the payment subdocument
                  }
                },
                {
                  $project: {
                    _id: 0,
                    month: '$_id.month',
                    year: '$_id.year',
                    orderIds: '$_id.orderid',
                    productNames: 1,
                    // category: 1,
                    quantity: 1,
                    amount: 1
                  }
                }
              ]);
              const heading = "Monthly Report";
              console.log("in report>> ",sales)
              res.render('salesReport',{sales,heading})
    }else  if(req.body.salesReport === "Daily"){
        
          const day = req.body.today;  
           targetDate = new Date(day);  
          console.log(targetDate)
          const sales = await ordercollection.aggregate([
            {
              $match: {
                deliveryDate: {
                  $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
                  $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
                },
                orderStatus: 'delivered'
              }
            },
            {
              $unwind: '$orderItems'
            },
            {
              $group: {
                _id: {
                  month: { $month: '$deliveryDate' },
                  year: { $year: '$deliveryDate' },
                  orderId: '$orderid'
                },
                productNames: { $push: '$orderItems.name' },
                // category: { $push: '$orderItems.productCategory' },
                quantity: { $sum: '$orderItems.quantity' },
                amount: { $first: '$totalAmount' } // Extract the amount from the payment subdocument
              }
            },
            {
              $project: {
                _id: 0,
                month: '$_id.month',
                year: '$_id.year',
                orderIds: '$_id.orderid',
                productNames: 1,
                // category: 1,
                quantity: 1,
                amount: 1
              }
            }
          ]);
          console.log("sales>>> ",sales)
          const heading = "Daily Report";
          
          res.render('salesReport',{sales,heading})

    }else  if(req.body.salesReport === "Yearly"){
      
      
           targetYear = req.body.year  
          console.log(targetYear)
          
          //const sales1 = await Orders.find(query)
          const sales = await ordercollection.aggregate([
            {
              $match: {
                deliveryDate: {
                  $gte: new Date(targetYear, 0, 1),
                  $lt: new Date(targetYear + 1, 0, 1),
                },
                orderStatus: 'delivered'
              }
            },
            {
              $unwind: '$orderItems'
            },
            {
              $group: {
                _id: {
                  month: { $month: '$deliveryDate' },
                  year: { $year: '$deliveryDate' },
                  orderId: '$orderid'
                },
                productNames: { $push: '$orderItems.name' },
                quantity: { $sum: '$orderItems.quantity' },
                amount: { $first: '$totalAmount' } // Extract the amount from the payment subdocument
              }
            },
            {
              $project: {
                _id: 0,
                month: '$_id.month',
                year: '$_id.year',
                orderIds: '$_id.orderid',
                productNames: 1,
                // category: 1,
                quantity: 1,
                amount: 1
              }
            }
          ]);
          console.log("sales>>> ",sales)
          const heading = "Yearly Report";
          
          res.render('salesReport',{sales,heading})
    }
  }catch(err){
          console.log("in report>> ",err.message)
  }
}

const LoaddownloadReport = async (req,res) => {
  try{
    let sales;
    console.log(req.body.mode);
    const mode = req.body.mode;
    if(mode === 'Monthly'){
       sales = await ordercollection.aggregate([
              {
                $match: {
                  deliveryDate: {
                    $gte: startofmonth,
                    $lte: endofmonth
                  },
                  orderStatus: 'delivered'
                }
              },
              {
                $unwind: '$orderItems'
              },
              {
                $group: {
                  _id: {
                    month: { $month: '$deliveryDate' },
                    year: { $year: '$deliveryDate' },
                    orderId: '$orderid'
                  },
                  productNames: { $push: '$orderItems.name' },
                  // category: { $push: '$orderItems.category' },
                  quantity: { $sum: '$orderItems.quantity' },
                  amount: { $first: '$totalAmount' } // Extract the amount from the payment subdocument
                }
              },
              {
                $project: {
                  _id: 0,
                  month: '$_id.month',
                  year: '$_id.year',
                  orderIds: '$_id.orderId',
                  productNames: 1,
                  // category: 1,
                  quantity: 1,
                  amount: 1
                }
              }
            ]);

          }if(mode === 'Daily'){

            sales = await ordercollection.aggregate([
              {
                $match: {
                  deliveryDate: {
                    $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
                    $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
                  },
                  orderStatus: 'delivered'
                }
              },
              {
                $unwind: '$orderItems'
              },
              {
                $group: {
                  _id: {
                    month: { $month: '$deliveryDate' },
                    year: { $year: '$deliveryDate' },
                    orderId: '$orderid'
                  },
                  productNames: { $push: '$orderItems.name' },
                  // category: { $push: '$orderItems.category' },
                  quantity: { $sum: '$orderItems.quantity' },
                  amount: { $first: '$totalAmount' } // Extract the amount from the payment subdocument
                }
              },
              {
                $project: {
                  _id: 0,
                  month: '$_id.month',
                  year: '$_id.year',
                  orderIds: '$_id.orderid',
                  productNames: 1,
                  // category: 1,
                  quantity: 1,
                  amount: 1
                }
              }
            ]);
          }if(mode === 'Yearly'){
            console.log(targetYear)
        
        //const sales1 = await Orders.find(query)
       sales = await ordercollection.aggregate([
          {
            $match: {
              deliveryDate: {
                $gte: new Date(targetYear, 0, 1),
                $lt: new Date(targetYear + 1, 0, 1),
              },
              orderStatus: 'delivered'
            }
          },
          {
            $unwind: '$orderItems'
          },
          {
            $group: {
              _id: {
                month: { $month: '$deliveryDate' },
                year: { $year: '$deliveryDate' },
                orderId: '$orderid'
              },
              productNames: { $push: '$orderItems.name' },
              // category: { $push: '$orderItems.category' },
              quantity: { $sum: '$orderItems.quantity' },
              amount: { $first: '$totalAmount' } // Extract the amount from the payment subdocument
            }
          },
          {
            $project: {
              _id: 0,
              month: '$_id.month',
              year: '$_id.year',
              orderIds: '$_id.orderid',
              productNames: 1,
              // category: 1,
              quantity: 1,
              amount: 1
            }
          }
        ]);
          }
         
    // Generate the PDF
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('report.pdf'));

  // Add content to the PDF
  doc.fontSize(12).text('Report ', { align: 'center' });
  doc.text('--------------------------');

  
  sales.forEach((document) => {
    doc.text(`Product: ${document.productNames}`);
    // doc.text(`Category: ${document.category}`);
    doc.text(`Quantity: ${document.quantity}`);
    doc.text(`Amount: ${document.amount}`);
    doc.text('--------------------------');
  });

 // Stream the PDF to the response
 const filename = 'report.pdf';
 res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
 res.setHeader('Content-Type', 'application/pdf');
 doc.pipe(res);
 doc.end();
  console.log('PDF report generated successfully.');

  }catch(err){
    console.log(err)
  }
}




module.exports = {
    loadLogin,
    verifyLogin,
    loadHomepage,
    loadUsermanagementpage,
    searchUser,
    userBlockstatus,
    loadCategorypage,
    searchCategory,
    loadAddcategory,
    verifyaddCategory,
    loadCategoryedit,
    verifyeditCategory,
    loadProductpage,
    loadAddproduct,
    searchProduct,
    loadeditProduct,
    verifyAddproduct,
    deleteCategory,
    deleteProduct,
    adminlogout,
    verifyEditproduct,
    deleteImage,
    loadOrderpage,
    loadAdminorder,
    verifycahngedate,
    verifychangestatus,
    loadCouponmanagementpage,
    loadaddCoupon,
    verifyaddCoupon,
    discardCoupon,
    editCoupon,
    VerifyeditCoupon,
    Loadlisted,
    changetolisted,
    Loadunlisted,
    LoadBanner,
    LoadaddBanner,
    LoadeditBanner,
    searchBanner,
    deleteBanner,
    VerifyaddBanner,
    VerifyeditBanner,
    LoadReport,
    LoaddownloadReport
}