const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { attachCookiesToResponse, createTokenUser } = require("../utils");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const verificationToken = crypto.randomBytes(40).toString("hex");

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken,
  });

  // send email verification

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "melissa.flatley14@ethereal.email",
      pass: "sd65SrR9V2R962EYtF",
    },
  });

  let info = await transporter.sendMail({
    from: 'fred foo <foo@example.com>',
    to: "bar@example.com",
    subject: "Verification",
    html: <h1>Hello Verify?</h1>
  });

  console.log(info);

  res.status(StatusCodes.CREATED).json({
    msg: "user created successfully, check email to verify account",
    verificationToken: user.verificationToken,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  const isUserVerified = user.isVerified;

  if (!isUserVerified) {
    throw new CustomError.UnauthenticatedError("User email is not verified");
  }

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now() + 1000),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;

  const user = await User.findOne({ email: email });

  if (!user) {
    throw new CustomError.NotFoundError("Verification failed");
  }

  if (user.verificationToken !== verificationToken) {
    throw new CustomError.UnauthenticatedError("Verification failed");
  }

  user.isVerified = true;
  user.verificationToken = "";
  user.verified = Date.now();

  await user.save();

  res.status(StatusCodes.OK).json({
    email: email,
    msg: "your email has been verified, thanks",
  });
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
};
