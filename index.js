const express = require('express');
const cors = require('cors');
const dotenv=require('dotenv');
const connectDB = require('./db')
dotenv.config();
connectDB();
const userModel = require("./model/userModel");



const app = express();
const PORT = process.env.PORT || 5001;



app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
   return res.status(200).json({
     message: "Chatbot app is working",
     status: "success",
   });
 });


 app.post("/register", async(req, res) => {
    
   
     const {name, email, password} = req.body;

     console.log(name, email, password);


     try{
         const userEmailExist = await userModel.findOne({email});

         if(userEmailExist){
          return res.status(400).json({message: "email already exist"});
         }


       

        const userObj = new userModel(
          {
            name : name,
            email : email,
            password : password,
          }
        )
        console.log(userObj);

        const userDb = await userObj.save();
        
        console.log("data saved");

        return res.send({
          status : 201,
          message : "User created successfully",
          user : userDb,
        })

     } catch(error){

   

        return res.status(500)
        .json(
          {
            status: 500,
            message: "Server Error",
            error: error.message,
         }
      )

     }

 }

)


app.get("/loggedInUser", async (req, res) => {
  try {
    console.log("Logged in user API called");
    const email = req.query.email;
    console.log("Email received from client:", email);

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const user = await userModel.findOne({email});
    console.log("User fetched from database:", user);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send(user);
  } catch (error) {
    console.error("Error in /loggedInUser:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



 app.listen(PORT, () => {
   console.log(
     `Server running on port:${process.env.PORT}`
    
   ); 
 });

