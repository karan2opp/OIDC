// module/oidc/clientRoutes.js

import express from "express";
import * as clientController from "./clientController.js";

const router = express.Router();

// Developer registers their app here
router.post("/register", clientController.registerClient);

export default router;


/*
Example POST body:

{
  "clientName": "Jingala",
  "redirectUris": ["http://localhost:3000/callback"],
  "scopes": ["openid", "profile", "email"],
  "grantTypes": ["authorization_code", "refresh_token"],
  "logoUrl": "",
  "homepageUrl": "https://jingala.com"
}
*/