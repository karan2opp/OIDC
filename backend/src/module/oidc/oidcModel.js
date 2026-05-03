// authorizationCodeModel.js

import mongoose from "mongoose";

const authorizationCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clientId: {
      type: String,
      required: true,
    },

    redirectUri: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: automatically remove expired codes
authorizationCodeSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const AuthorizationCode = mongoose.model(
  "AuthorizationCode",
  authorizationCodeSchema
);

export default AuthorizationCode;