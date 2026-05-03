import mongoose from "mongoose"

const connectDB=async()=>{
    const conn=await mongoose.connect(`${process.env.MONGODB_URI}`)
    console.log("db connected");
    console.log(conn.connection.host);
    
    
}

export default connectDB