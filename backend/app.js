
import express, { urlencoded } from "express"
import cookieParser from "cookie-parser";
import authRoute from "./src/module/auth/authRoutes.js"
import oidcRoute from "./src/module/oidc/oidcRoutes.js"
import clientRoute from "./src/module/client/clientRoute.js"
import cors from "cors"
import { configDotenv } from "dotenv"
configDotenv();
const app=express()
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,           // https://auth.karanop.in
      process.env.CHECKBOX_URL,           // https://checkbox.karanop.in
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
import session from "express-session";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,        // 👈 must be true in production with HTTPS
      sameSite: "none",    // 👈 must be none for cross-domain
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use("/api/auth", authRoute);
app.use("/api/oidc",oidcRoute);
app.use("/api/clients/",clientRoute)
app.use((err, req, res, next) => {
  console.log(err);
  
  res.status(500).json({ message: err.message });

});
export default app;