// module/oidc/clientService.js

import crypto from "crypto";
import Client from "./clientModel.js";
import ApiError from "../../common/utils/apiError.js";

const generateClientId = () => {
  return `client_${crypto.randomBytes(16).toString("hex")}`;
};

const generateClientSecret = () => {
  return crypto.randomBytes(32).toString("hex");
};

const registerClient = async ({
  clientName,
  redirectUris,
  scopes,
  grantTypes,
  logoUrl,
  homepageUrl,
}) => {
  if (!clientName || !redirectUris?.length) {
    throw ApiError.badRequest("Client name and redirect URI are required");
  }

  const clientId = generateClientId();
  const clientSecret = generateClientSecret();

  const client = await Client.create({
    clientId,
    clientSecret,
    clientName,
    redirectUris,
    scopes: scopes?.length ? scopes : ["openid", "profile", "email"],
    grantTypes: grantTypes?.length
      ? grantTypes
      : ["authorization_code", "refresh_token"],
    logoUrl,
    homepageUrl,
  });

  return {
    clientId: client.clientId,
    clientSecret,
    clientName: client.clientName,
    redirectUris: client.redirectUris,
    scopes: client.scopes,
    grantTypes: client.grantTypes,
  };
};

const getClientById = async (clientId) => {
  const client = await Client.findOne({ clientId, isActive: true }).select(
    "+clientSecret"
  );

  if (!client) {
    throw ApiError.notFound("Client not found");
  }

  return client;
};

export {
  registerClient,
  getClientById,
};
