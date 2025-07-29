const mongoose = require("mongoose")

const connectDB = async()=>{
    try {
        await mongoose.connect(
          "mongodb+srv://someshrocks144:somesh@cluster0.3yjg5dv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        );
        console.log("Connected To DB")
    } catch (error) {
        console.log(error)
    }
}
module.exports = connectDB