const express = require('express');
const {followUserController, unfollowUserController, getFollowingUsers, getFollowers} = require('../controllers/followController');
const followRouter = express.Router();

followRouter.post('/follow-user', followUserController)
                .post("/unfollow-user", unfollowUserController)
                .post("/get-followings", getFollowingUsers )
                .post("/get-followers", getFollowers)

module.exports = followRouter;