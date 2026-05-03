// oidcService.js
// Full OIDC flow using JOSE instead of jsonwebtoken for ID Token + JWKS

import crypto from "crypto";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import {
  importPKCS8,
  importSPKI,
  SignJWT,
  exportJWK,
  jwtVerify,
} from "jose";

import AuthorizationCode from "./oidcModel.js";
import User from "../auth/authModels.js";
import ApiError from "../../common/utils/apiError.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../../common/utils/jwtUtills.js";


const ISSUER = process.env.ISSUER;
// Read PEM files
const privateKeyPem = fs.readFileSync("./cert/private-key.pem", "utf8");
const publicKeyPem = fs.readFileSync("./cert/public-key.pub", "utf8");

//
// 1. Generate Authorization Code
//
const generateAuthorizationCode = async ({
  userId,
  clientId,
  redirectUri,
}) => {
  if (!userId || !clientId || !redirectUri) {
    throw ApiError.badRequest("Missing required fields");
  }

  const code = crypto.randomBytes(32).toString("hex");

  await AuthorizationCode.create({
    code,
    userId,
    clientId,
    redirectUri,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    used: false,
  });

  return code;
};

//
// 2. Validate Authorization Code
//
const validateAuthorizationCode = async ({
  code,
  clientId,
  redirectUri,
}) => {
  const authCode = await AuthorizationCode.findOne({
    code,
    clientId,
    redirectUri,
    used: false,
  });

  if (!authCode) {
    throw ApiError.unauthorized("Invalid authorization code");
  }

  if (authCode.expiresAt < new Date()) {
    throw ApiError.unauthorized("Authorization code expired");
  }

  authCode.used = true;
  await authCode.save();

  return authCode;
};

//
// 3. Generate ID Token using JOSE
//
const generateIdToken = async (user, clientId) => {
  const privateKey = await importPKCS8(privateKeyPem, "RS256");

  return new SignJWT({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({
      alg: "RS256",
      kid: "kauth-key-1",
    })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(clientId) // ✅ dynamic
    .setExpirationTime("15m")
    .sign(privateKey);
};
//
// 4. Exchange Code → Tokens
//
const exchangeCodeForTokens = async ({
  code,
  clientId,
  redirectUri,
}) => {
  const authCode = await validateAuthorizationCode({
    code,
    clientId,
    redirectUri,
  });

  const user = await User.findById(authCode.userId);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user._id,
  });

  // ✅ FIXED
  const idToken = await generateIdToken(user, clientId);

  return {
    accessToken,
    refreshToken,
    idToken,
    tokenType: "Bearer",
    expiresIn: 900,
  };
};

//
// 5. Refresh Access Token
//
const regenerateAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token missing");
  }

  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
  });

  return { accessToken };
};

//
// 6. UserInfo Endpoint
//
const getUserInfo = async (accessToken) => {
  if (!accessToken) {
    throw ApiError.unauthorized("Access token missing");
  }

  const decoded = verifyAccessToken(accessToken);

  const user = await User.findById(decoded.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return {
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
  };
};

//
// 7. JWKS Endpoint
//
const getJwks = async () => {
  const publicKey = await importSPKI(publicKeyPem, "RS256");

  const jwk = await exportJWK(publicKey);

  return {
    keys: [
      {
        ...jwk,
        use: "sig",
        alg: "RS256",
        kid: "kauth-key-1",
      },
    ],
  };
};

//
// 8. Optional: Verify ID Token using JOSE
//
const verifyIdToken = async (token, clientId) => {
  const publicKey = await importSPKI(publicKeyPem, "RS256");

  const { payload } = await jwtVerify(token, publicKey, {
    issuer: process.env.ISSUER,
    audience: clientId, // ✅ dynamic
  });

  return payload;
};

export {
  generateAuthorizationCode,
  validateAuthorizationCode,
  generateIdToken,
  exchangeCodeForTokens,
  regenerateAccessToken,
  getUserInfo,
  getJwks,
  verifyIdToken,
};