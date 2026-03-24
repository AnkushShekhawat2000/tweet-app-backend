const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");
dotenv.config();
connectDB();
const userModel = require("./model/userModel");
const postModel = require("./model/postModel");
const followRouter = require("./routers/followRouter");
const followModel = require("./model/followModel");

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

app.use("/follow", followRouter);

app.post("/register", async (req, res) => {
  const { username, name, email, password } = req.body;

  try {
    const userEmailExist = await userModel.findOne({ email });

    if (userEmailExist) {
      return res.status(400).json({ message: "email already exist" });
    }

    const userNameExist = await userModel.findOne({ username });
    if (userNameExist) {
      return res.status(400).json({ message: "Username already exist" });
    }

    const userObj = new userModel({
      username: username,
      name: name,
      email: email,
      password: password,
    });

    console.log(userObj);

    const userDb = await userObj.save();

    console.log("data saved");

    return res.send({
      status: 201,
      message: "User created successfully",
      user: userDb,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Server Error",
      error: error.message,
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.status(200).json({
      message: "Login successful",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/google-login", async (req, res) => {
  const { name, email, profilePhoto } = req.body;

  try {
    let user = await userModel.findOne({ email });

    if (user) {
      return res.status(200).json({
        message: "Login success",
        user,
      });
    }

    const newUser = new userModel({
      name,
      email,
      username: email.split("@")[0],
      profilePhoto,
      password: "GOOGLE_AUTH_USER",
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User created",
      user: savedUser,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/loggedInUser", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send(user);
  } catch (error) {
    //console.error("Error in /loggedInUser:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.post("/create-post", async (req, res) => {
  try {
    const { profilePhoto, postBody, postImage, username, name, email, userId } =
      req.body;


    const postObj = new postModel({
      profilePhoto: profilePhoto,
      postBody: postBody,
      postImage: postImage,
      username: username,
      name: name,
      email: email,
      userId,
    });

    const savedPost = await postObj.save();

    return res.status(201).json({
      status: 201,
      message: "post created successfully",
      post: savedPost,
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "Server Error",
      error: error.message,
    });
  }
});

app.delete("/delete-post/:id", async (req, res) => {
  const postId = req.params.id;
  const { email } = req.body;

  try {
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 404,
        message: "Post not found",
      });
    }

    if (post.email !== email) {
      return res.status(403).json({
        status: 403,
        message: "Unauthorized: You can delete only your post",
      });
    }

    await postModel.findByIdAndDelete(postId);

    return res.status(200).json({
      status: 200,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Server Error",
      error: error.message,
    });
  }
});

app.patch("/edit-post/:id", async (req, res) => {
  const postId = req.params.id;
  const { email, postBody, postImage } = req.body;

  try {
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: 404,
        message: "Post not found",
      });
    }

    if (post.email !== email) {
      return res.status(403).json({
        status: 403,
        message: "Unauthorized: You can edit only your post",
      });
    }

    post.postBody = postBody !== undefined ? postBody : post.postBody;
    post.postImage = postImage !== undefined ? postImage : post.postImage;

    const updatedPost = await post.save();

    return res.status(200).json({
      status: 200,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Server Error",
      error: error.message,
    });
  }
});

app.post("/get-all-posts", async (req, res) => {
  const { userId } = req.body;
  try {
    const posts = await postModel.find().sort({ creationDateTime: -1 });

    const updatedPosts = await Promise.all(
      posts.map(async (post) => {
        const isFollowing = await followModel.findOne({
          followerUserId: userId,
          followingUserId: post.userId,
        });

        const isLiked = post.likes.includes(userId);

        const isBookmarked = post.bookmarks.some(
          (id) => id.toString() === userId,
        );

        return {
          _id: post._id,
          postBody: post.postBody,
          postImage: post.postImage,
          userId: post.userId,
          name: post.name,
          username: post.username,
          profilePhoto: post.profilePhoto,
          creationDateTime: post.creationDateTime,

          isFollowing: !!isFollowing,
          isLiked,
          likeCount: post.likes.length,
          isBookmarked,
        };
      }),
    );
    res.json(updatedPosts);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Server Error",
      error: error.message,
    });
  }
});

app.get("/get-user-posts", async (req, res) => {
  const email = req.query.email;

  try {
    const posts = await postModel
      .find({ email })
      .sort({ creationDateTime: -1 });
    return res.send(posts);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Server Error",
      error: error.message,
    });
  }
});

app.get("/userpost", async (req, res) => {
  const email = req.query.email;
  const user = await postModel.find({ email }).sort({ creationDateTime: -1 });
  return res.send(user);
});

app.patch("/userupdate/:email", async (req, res) => {
  console.log("update profile execute");
  const email = req.params.email;
  const needToUpdateInfo = req.body;

  try {
    const find = await userModel.find({ email: email });

    const updatedInfo = await userModel.findOneAndUpdate(
      { email },
      needToUpdateInfo,
      { new: true },
    );

    if (!updatedInfo) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "Profile updated successfully", updatedInfo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
});

app.post("/like", async (req, res) => {
  const { postId, userId } = req.body;

  try {
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      return res.json({ message: "Already liked" });
    }

    post.likes.push(userId);
    await post.save();

    return res.json({ message: "Liked successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/unlike", async (req, res) => {
  const { postId, userId } = req.body;

  try {
    await postModel.findByIdAndUpdate(postId, {
      $pull: {
        likes: userId,
      },
    });

    res.json({ message: "Unliked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/bookmark", async (req, res) => {
  const { postId, userId } = req.body;

  try {
    await postModel.findByIdAndUpdate(postId, {
      $addToSet: {
        bookmarks: userId,
      },
    });

    res.json({ message: "Bookmarked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/unbookmark", async (req, res) => {
  const { postId, userId } = req.body;

  try {
    await postModel.findByIdAndUpdate(postId, {
      $pull: {
        bookmarks: userId,
      },
    });

    res.json({ message: "Unbookmarked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port:${process.env.PORT}`);
});
