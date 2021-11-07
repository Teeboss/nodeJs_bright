const express = require('express');
const mysql =  require('mysql');
const multer = require('multer')
const path = require('path')
//const ejs = require('ejs')
const cookParser = require('cookie-parser')
const session = require('express-session');
//const bodyParser =  require('body-parser');
const bcrypt = require('bcrypt')
const salt = bcrypt.genSalt(10)
const app = express();
const storage = multer.diskStorage({
   destination : (req , file , cb) => {
     cb(null , __dirname+"/images")
   } , 
   filename : (req , file , cb) => {
       cb(null , file.fieldname+"_"+Date.now()+"_"+path.extname(file.originalname))
   }
})
const upload = multer({storage : storage})
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(cookParser());
app.use(express.static(__dirname+'/images'))
app.engine('html' , require('ejs').renderFile)
app.set('view engine' , 'html')
app.use(session({
    name: 'appsid',
    secret: 'Math.random(23456789899877)',
    resave : false,
    saveUninitialized: true 

}))
const db = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "",
    database : "tecb_plan"
})
app.get('/' , function (req , res) {
res.redirect("/home")
}) 
app.post('/login' , (req , res) =>{
    let username = req.body.username
    let password = req.body.password
    if (username && password) {
    db.query('SELECT username FROM users WHERE username = ?' ,[username], (err , row , field) => {
        console.log(row)
        if (row.length > 0) {
            db.query('SELECT password , id , username FROM users WHERE username = ?' ,[username], (err , row , field) => {
                var validPassword = bcrypt.compare(password , row[0].password)
                if (validPassword) {
                    req.session.login = true
                    req.session.userId = row[0].id
                    req.session.username = row[0].username
                    req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                  //  console.log(req.session)
                    req.session.save()
                    res.redirect("/home")
                } else {
                    res.send('notPassword')
                }
            })
        } else {
            res.send('notUser')
        }
    })
 } else {
     console.log('not connected')
 }
})

app.get("/home" , (req , res) => {
   if (req.session.login) {
    res.render(__dirname+"/views/dashboard.html" , {user:req.session.username})
   // res.send(req.session.userId)
} else {
      res.sendFile(__dirname+"/views/login.html")
    // res.send(false)
   }
})
app.post("/uploading" , upload.single('image') , (req , res ) => {
    //console.log(req.session.userId)
   // console.log(req.body.fileid)
   console.log(req.file.filename)
   db.query('SELECT id FROM users WHERE username = ?',  [req.body.fileid] , (err, row , field)=> {
       if (err) throw err
       if (row.length > 0) {
        db.query(`INSERT INTO upload VALUES(\'\' , ? , ? , NOW())`, [row[0].id , req.file.filename ] , (err , row , field) => {
            if (err) {
                throw err
            }
            res.send("file uploaded successfully")
         })
       }
   })
})
app.get('/market' , (req , res ) => {
    db.query('SELECT * FROM upload' , (err , row , field)=> {
        if (err) {
            throw err
        }
        if (row.length > 0) {
           res.render('market.html' , {productDetails:row}) 
        }
    })
})
app.post('/signup' , function (req , res ) { 
    const username = req.body.username 
    var password = req.body.password
    db.query("SELECT username FROM users WHERE username = ? " , [username] , function (err , row , field) {
       if (row.length > 0) {
           res.send("userExist")
       } else {
         bcrypt.hash(password , 10 , (err , hash ) => {
             password = hash 
            db.query("INSERT INTO users VALUES ( \'\' , ? , ? )" , [username , password] , (err , row , field) => {
                res.send(password)
              })
         })
       }
    })
 })
app.listen(400 , () => {
    console.log('connected')
})