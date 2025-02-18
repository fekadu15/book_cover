import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
 const app = express();
 const port = 3000;
 app.use(bodyParser.urlencoded({extended:true}));
 app.use(express.json());
 app.use(express.static("public"))
 
 const db = new pg.Client({
   user: process.env.DB_USER,
   
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT
 })
 db.connect();
 let books = [];
 let cover;
 app.get("/",async(req,res)=>{
   res.render("index.ejs",{books:books })
 })
 app.post("/add", async(req,res)=>{
   try{  
      let isbn = req.body.book_isbn 
      const result = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`);
     cover  = result.config.url; 
let  title  = req.body.title;
let  rating = req.body.rating;
let  review = req.body.review;
let  date   = req.body.date;

 await db.query(
      "insert into book_cover(title,rating,review,date,cover)values($1,$2,$3,$4,$5)",
       [title,rating,review,date,cover]);
       let id_result = await db.query("select id from book_cover where title = ($1)",[title]);
       let id = id_result.rows[0].id;
       let  new_book = {
        title: title,
        rating:rating,
        review:review,
        date:date,
        cover:cover,
        id: id
     };
      books.push(new_book);
 res.render("index.ejs",{books:books})
   }

   catch(err){
      console.log(err);
   }
 })
 app.get("/edit/:id", async(req,res)=>{
  
  try{let id = req.params.id;
  let index = books.findIndex((book)=>book.id == id);
  let book = books[index]
 res.render("update.ejs",{book}) 
  }catch(err){
   console.log(err);
  }
 });
 app.post("/update/:id", async(req,res)=>{
 
   try{
   let id = req.params.id;
   let title = req.body.title;
   let rating = req.body.rating;
   let review = req.body.review;
   let date = req.body.date;
   let index = books.findIndex((i)=>i.id ==id);
   cover = books[index].cover;
   await db.query(" update book_cover set title = $1,rating=$2,date=$3,review=$4 where id=$5",
      [title,rating,date,review,id]);
   let updated_value = {
      title:title,
      rating:rating,
      id:id,
      date:date,
      review:review,
      cover:cover
   }
   books[index]=updated_value;
      res.redirect("/");
}
catch(err){
   console.log(err);
}
 })
 app.post("/delete/:id",async(req,res)=>{
  try{
   let id = req.params.id;
    await db.query("delete from book_cover where id=$1",[id])
    let index = books.findIndex((i)=>i.id == id);
    books.splice(index,1);
    res.redirect("/");
  }catch(err){
   console.log(err);
  }
 })
 app.get("/sortbyrating",async(req,res)=>{
  try{
   let sort_result = await db.query("select * from book_cover order by rating desc");
  
  books = sort_result.rows.map((book)=>{
    return({...book,
      date:getDate(book.date)
    })
   })
   res.redirect("/");
  }catch(err){
   console.log(err);
  }
 })
 app.get("/sortbyrecency",async(req,res)=>{
 try{
   let sort_result = await db.query("select * from book_cover order by date asc");
   books = sort_result.rows.map((book)=>{
      return({...book, date: getDate(book.date)
   })
   })
  res.redirect("/");
}
catch(err){
   console.log(err);
}
 })
 app.listen(port,()=>{
  console.log(`server is running on http://localhost:${port}`)
 })

 function getDate(date){
   return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
 }