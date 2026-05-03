// oidcController.js

import * as oidcService from "./oidcServices.js";
import ApiResponse from "../../common/utils/apiResponse.js";
import ApiError from "../../common/utils/apiError.js";

import * as clientService from "../client/clientService.js";
import dotenv from "dotenv";
dotenv.config();

const ISSUER = process.env.ISSUER;

const openIdConfiguration = async (req, res) => {
  return res.json({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/authorize`,
    token_endpoint: `${ISSUER}/token`,
    userinfo_endpoint: `${ISSUER}/userinfo`,
    jwks_uri: `${ISSUER}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
  });
};

const jwks = async (req, res) => {
  const data = await oidcService.getJwks();
  return res.json(data);
};

const authorize = async (req, res) => {
  const { client_id, redirect_uri, state } = req.query;

  if (!client_id || !redirect_uri) {
    throw ApiError.badRequest("client_id and redirect_uri are required");
  }

  const client = await clientService.getClientById(client_id);

  if (!client) {
    throw ApiError.unauthorized("Invalid client");
  }

  const isValidRedirectUri = client.redirectUris.includes(redirect_uri);

  if (!isValidRedirectUri) {
    throw ApiError.unauthorized("Invalid redirect URI");
  }

  // ✅ FIXED LOGIN FLOW
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;

    return req.session.save(() => {
      res.redirect(`${process.env.FRONTEND_URL}/login`);
    });
  }

  const code = await oidcService.generateAuthorizationCode({
    userId: req.session.user.id,
    clientId: client_id,
    redirectUri: redirect_uri,
  });

  return res.redirect(
    `${redirect_uri}?code=${code}&state=${state || ""}`
  );
};

const token = async (req, res) => {
  const {
    code,
    client_id,
    client_secret,
    redirect_uri,
    grant_type,
  } = req.body;

  if (!code || !client_id || !client_secret || !redirect_uri) {
    throw ApiError.badRequest("Missing required fields");
  }

  if (grant_type && grant_type !== "authorization_code") {
    throw ApiError.badRequest("Unsupported grant type");
  }

    const client = await clientService.getClientById(client_id);

  if (client.clientSecret !== client_secret) {
    throw ApiError.unauthorized("Invalid client secret");
  }

  const isValidRedirectUri = client.redirectUris.includes(redirect_uri);

  if (!isValidRedirectUri) {
    throw ApiError.unauthorized("Invalid redirect URI");
  }

  const tokens = await oidcService.exchangeCodeForTokens({
    code,
    clientId: client_id,
    redirectUri: redirect_uri,
  });

  ApiResponse.ok(res, "Tokens generated", tokens);
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token missing");
  }

  const data = await oidcService.regenerateAccessToken(refreshToken);

  ApiResponse.ok(res, "Access token refreshed", data);
};

const userInfo = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw ApiError.unauthorized("Access token missing");
  }

  const user = await oidcService.getUserInfo(token);

  ApiResponse.ok(res, "User info fetched", user);
};

export {
  openIdConfiguration,
  jwks,
  authorize,
  token,
  refreshAccessToken,
  userInfo,
};
