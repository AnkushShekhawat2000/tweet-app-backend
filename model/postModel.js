const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        profilePhoto : {
            type: String
        },

        postBody : {
            type: String
        },
        
        postImage : {
            type : String
        },

        username : {
            type : String
        },
        name : {
            type : String
        },
        email :{
            type : String
        },

        creationDateTime : {
            type : Number,
            default : Date.now,
        }

    }
)


module.exports = mongoose.model("post", postSchema);