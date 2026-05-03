// oidcRoutes.js

import express from "express";
import * as oidcController from "./oidcController.js";

const router = express.Router();

// Discovery endpoint
router.get("/.well-known/openid-configuration", oidcController.openIdConfiguration);

// Public key endpoint
router.get("/.well-known/jwks.json", oidcController.jwks);

// Step 1 → generate authorization code
router.get("/authorize", oidcController.authorize);

// Step 2 → exchange code for tokens
router.post("/token", oidcController.token);

// Protected endpoint using access token
router.get("/userinfo", oidcController.userInfo);

// Refresh access token using refresh token
router.post("/refresh-token", oidcController.refreshAccessToken);
router.get("/callback", (req, res) => {
  res.json({
    code: req.query.code,
    state: req.query.state,
  });
});
export default router;