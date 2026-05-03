import ApiResponse from "../../../src/common/utils/apiResponse.js"
import * as authService from "./authServices.js"
import crypto from "crypto"
const register=async(req,res)=>{
    const {name,email,password}=req.body
    const user=await authService.register(name,email,password)
 ApiResponse.created(
    res,
    "Registration successful. Please verify your email.",
    user,
  );

}

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("login hit");
  console.log("login session id:", req.sessionID);

  const { user, accessToken, refreshToken } = await authService.login(email, password);

  req.session.user = {
    id: user._id,
    email: user.email,
  };

  // save session before responding
  await new Promise((resolve) => req.session.save(resolve));

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none", // 👈 changed from strict to none
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  ApiResponse.ok(res, "Login successful", {
    user,
    accessToken,
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