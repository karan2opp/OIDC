// module/oidc/clientModel.js

import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    clientSecret: {
      type: String,
      required: true,
      select: false,
    },

    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    redirectUris: [
      {
        type: String,
        required: true,
      },
    ],

    scopes: [
      {
        type: String,
        default: "openid",
      },
    ],

    grantTypes: [
      {
        type: String,
        default: "authorization_code",
      },
    ],

    logoUrl: {
      type: String,
      default: "",
    },

    homepageUrl: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model("Client", clientSchema);
export default Client;




