const express = require('express');
const cors = require('cors');
const dotenv=require('dotenv');
const connectDB = require('./db')
dotenv.config();
connectDB();
const userModel = require("./model/userModel");
const postModel = require("./model/postModel")


const app = express();
const PORT = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
   return res.status(200).json({
     message: "twitter app is working",
     status: "success",
   });
 });


 app.post("/register", async(req, res) => {
    

     const {username, name, email, password} = req.body;

     try{
         const userEmailExist = await userModel.findOne({email});

         if(userEmailExist){
          return res.status(400).json({message: "email already exist"});
         }


         const userNameExist = await userModel.findOne({username});
         if(userNameExist){
          return res.status(400).json({message: "Username already exist"});
         }

        const userObj = new userModel(
          {
            username : username,
            name : name,
            email : email,
            password : password,
          }
        )


        console.log(userObj);

        const userDb = await userObj.save();
        
        console.log("data saved")

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



app.post("/create-post", async (req, res) => {
    console.log("hitted");
 try {

        const {profilePhoto, postBody, postImage, username, name, email} = req.body;

        console.log(req.body);

        const postObj = new postModel(
          {
            profilePhoto : profilePhoto,
            postBody : postBody,
            postImage : postImage,
            username : username,
            name : name,
            email : email,
          }
        )  


          const savedPost = await postObj.save();

              return res.status(500).json(
                    {
                      status: 201,
                      message: "post created successfully",
                      post : savedPost
                  }
                )

 } catch(err){
      return res.status(500)
      .json(
        {
          status: 500,
          message: "Server Error",
          error: error.message,
      }
    )
 }



  

 

})



app.get("/get-all-posts", async(req, res) => {

   try{
    const posts = await postModel.find().sort({creationDateTime : -1});
    return res.send(posts);
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
})


app.get("/get-user-posts", async(req, res) => {
  const email = req.query.email;
  
  try{
   const posts = await postModel.find({email}).sort({creationDateTime : -1});
   return res.send(posts);
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
})



app.get("/userpost", async (req, res) => {
  const email = req.query.email;
  const user = await  postModel.find({email}).sort({creationDateTime : -1});
  return res.send(user);
})

app.patch("/userupdate/:email", async (req, res) => {

  console.log("update profile execute");
  const email = req.params.email;
  const needToUpdateInfo = req.body;

  console.log(needToUpdateInfo);


  try{

    const find = await userModel.find({email:email});
    console.log(find);
      const updatedInfo = await userModel.findOneAndUpdate(
        {email},
        needToUpdateInfo,
        { new: true }
      );
    
  
    
      if (!updatedInfo) {
        return res.status(404).json({ message: "User not found" });
      }
    
      return res.status(200).json({ message: "Profile updated successfully", updatedInfo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
  
})


 app.listen(PORT, () => {
   console.log(
     `Server running on port:${process.env.PORT}`
    
   ); 
 });

