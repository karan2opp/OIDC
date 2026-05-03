import http from "http"
import { configDotenv } from "dotenv"
import app from "./app.js"
import connectDB from "./src/common/config/db.js"
configDotenv()


const server=http.createServer(app)
const PORT=process.env.PORT || 8000

const start=async()=>{
  await  connectDB()
    server.listen(PORT,()=>{
    console.log(`listening on ${PORT}`);
    
})
}


start().catch((err) => {
    console.error("Failed to start server", err)
    process.exit(1)
})
