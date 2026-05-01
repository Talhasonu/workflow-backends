const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');


const generateToken = (userId, expires, type, secret = config.jwt.secret, context = {}) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    ...context,
  };
  return jwt.sign(payload, secret);
};


const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  if (payload.type !== type) {
    throw new Error('Invalid token type');
  }
  return payload;
};


const generateAuthTokens = async (user) => {
  const tokenContext = {
    workspaceId: user.workspaceId || null,
    userType: user.userType,
  };

  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS, config.jwt.secret, tokenContext);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH, config.jwt.secret, tokenContext);

  await User.findByIdAndUpdate(user.id, {
    $set: {
      lastActive: new Date(),
    },
  });

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};


const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};


const generateVerifyEmailToken = async ({ email, password }) => {
  if (await User.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken({ email, password }, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

const gererateAddMemberToken = async (data) => {
  const expires = moment().add(config.jwt.addMemberExpirationMinutes, 'minutes');
  const payload = { sub: data, iat: moment().unix(), exp: expires.unix(), type: tokenTypes.ADD_MEMBER, };
  return jwt.sign(payload, config.jwt.secret);
}

module.exports = {
  generateToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  gererateAddMemberToken,
};
