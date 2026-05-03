import ApiError from "../../../src/common/utils/apiError.js"
import { generateAccessToken, generateRefreshToken, generateResetToken, verifyRefreshToken } from "../../../src/common/utils/jwtUtills.js"
import {sendVerificationEmail,sendResetPasswordEmail} from "../../../src/common/config/email.js"
import User from "./authModels.js"
import crypto from "crypto";
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
const register=async(name,email,password)=>{
  const exist=await User.findOne({email})
  if(exist)throw ApiError.conflict("User already exist")

    const {rawToken,hashedToken}=generateResetToken()

    const user=await User.create({
        name,email,password,verificationToken:hashedToken
    })
  try {
    await sendVerificationEmail(email, rawToken);
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
  }
console.log(user);

const userObj = user.toObject();
  delete userObj.password;
  delete userObj.verificationToken;

  return userObj;

    
}
const login=async(email,password)=>{
  const user = await User.findOne({ email }).select("+password");
  if(!user)throw ApiError.unauthorized("Invalid email or password")
  const isMatch = await user.comparePassword(password);
  if(!isMatch)throw ApiError.unauthorized("Invalid email or password")
if(!user.isVerified)throw ApiError.unauthorized("First verify your email")

 const accessToken = generateAccessToken({ id: user._id, role: user.role });
const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken=hashToken(refreshToken)
    user.save({validateBeforeSave:false})


    const userObj=user.toObject()
    delete userObj.password;
  delete userObj.verificationToken;
return {user:userObj,accessToken,refreshToken}


}
const logout=async(userId)=>{
 await User.findByIdAndUpdate(userId,{refreshToken:null})

}

const verifyEmail = async (token) => {
  const trimmed = String(token).trim();

  if (!trimmed) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }
 
  

  // DB stores SHA256(raw). Links / email use the raw token — we hash for lookup.
  // If you paste the hash from MongoDB into Postman, hashing again would not match;
  // so we also try a direct match on the stored value.
  const hashedInput = hashToken(trimmed);
  let user = await User.findOne({ verificationToken: hashedInput }).select(
    "+verificationToken",
  );
  console.log(hashedInput);
  console.log(user);
  

  
  if (!user) {
    user = await User.findOne({ verificationToken: trimmed }).select(
      "+verificationToken",
    );
  }
  if (!user) throw ApiError.badRequest("Invalid or expired verification token");

  await User.findByIdAndUpdate(user._id, {
    $set: { isVerified: true },
    $unset: { verificationToken: 1 },
  });

  return user;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound("No account with that email");

  const { rawToken, hashedToken } = generateResetToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  try {
    await sendResetPasswordEmail(email, rawToken);
  } catch (err) {
    console.error("Failed to send reset email:", err.message);
  }
};
const resetPassword = async (token, newPassword) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) throw ApiError.badRequest("Invalid or expired reset token");

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};
const refresh = async (token) => {
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user) throw ApiError.unauthorized("User no longer exists");

  // Verify the refresh token matches what's stored (prevents reuse of old tokens)
  if (user.refreshToken !== hashToken(token)) {
    throw ApiError.unauthorized("Invalid refresh token — please log in again");
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });

  return { accessToken };
};
const getMe = async (userId) => {
 
  
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return user;
};
export const updateProfile = async (userId, data, imageFile) => {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound("User not found")

  if (data.name)  user.name  = data.name
  if (data.phone) user.phone = data.phone

  if (imageFile) {
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId)
    }
    user.avatar = await uploadToCloudinary(imageFile.buffer, "avatars")
  }

  await user.save()
  return user.toObject()
}

export const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password -refreshToken")
  if (!user) throw ApiError.notFound("User not found")
  return user
}
export {login,register,logout,verifyEmail,resetPassword,refresh,getMe,forgotPassword}