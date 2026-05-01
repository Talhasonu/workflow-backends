const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');
const bcrypt = require('bcryptjs');


const loginUserWithEmailAndPassword = async (email, password) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await userService.getUserByEmail(normalizedEmail, true);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect password');
  }

  await User.findByIdAndUpdate(user._id, {
    $set: {
      lastLoggedIn: new Date(),
      lastActive: new Date(),
    },
  });

  user.password = undefined;
  return user;
};


const logout = async (refreshToken) => {
  try {
    await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
};


const refreshAuth = async (refreshToken) => {
  try {
    const payload = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(payload.sub);
    if (!user) {
      throw new Error();
    }
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};


const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const payload = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(payload.sub);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};


const verifyEmail = async (verifyEmailToken) => {
  try {
    const payload = jwt.verify(verifyEmailToken, config.jwt.secret);
    if (payload) {
      return payload
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
