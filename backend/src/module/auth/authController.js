import ApiResponse from "../../../src/common/utils/apiResponse.js"
import { generateAccessToken } from "../../common/utils/jwtUtills.js";
import * as authService from "./authServices.js"
import crypto from "crypto"
const register = async (req, res) => {
  const { name, email, password } = req.body;
  const { client_id, redirect_uri, response_type, scope } = req.query; // 👈 get from query

  const user = await authService.register(name, email, password);

  if (client_id && redirect_uri) {
    // OIDC flow - redirect to login
    return res.redirect(
      `/login?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}`
    );
  }

  // normal flow - return JSON
  return ApiResponse.created(
    res,
    "Registration successful. Please verify your email.",
    user,
  );
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login(email, password);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // generate short lived login token for OIDC flow
const loginToken = generateAccessToken({ id: user._id, role: user.role });
console.log("loginToken:", loginToken); // 👈
  ApiResponse.ok(res, "Login successful", {
    user,
    accessToken,
    loginToken, // 👈 used for OIDC redirect
  });
};
const logout=async(req,res)=>{
  await authService.logout(req.body.id)
   res.clearCookie("refreshToken");
  ApiResponse.ok(res, "Logged out successfully");
}

const verifyEmail=async(req,res)=>{
  await authService.verifyEmail(req.params.token)
  console.log(res);
  
   ApiResponse.ok(res, "Email verified successfully");
}

const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  
; 
  const { accessToken } = await authService.refresh(token);
 
  
  ApiResponse.ok(res, "Token refreshed", { accessToken });
};



const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  ApiResponse.ok(res, "Password reset email sent");
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  ApiResponse.ok(res, "Password reset successful");
};

const getMe = async (req, res) => {
   
   
  const user = await authService.getMe(req.user.id);
 
 
  
  ApiResponse.ok(res, "User profile", user);
};

export const updateProfile = async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body, req.file)
  ApiResponse.ok(res, "Profile updated successfully", user)
}

export const getProfile = async (req, res) => {
  const user = await authService.getProfile(req.user.id)
  ApiResponse.ok(res, "Profile fetched successfully", user)
}
export {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
};