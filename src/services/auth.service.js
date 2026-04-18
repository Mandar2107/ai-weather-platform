const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const jwtSecret = process.env.JWT_SECRET || "dev_secret_key";

exports.registerUser = async (data) => {
  const username = data.username?.trim();
  const password = data.password?.trim();

  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const existingUser = await User.findOne({ where: { username } });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashedPassword,
    role: data.role || "ADMIN"
  });

  return {
    message: "User registered",
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};

exports.loginUser = async (data) => {
  const username = data.username?.trim();
  const password = data.password?.trim();

  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const user = await User.findOne({ where: { username } });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new Error("Invalid username or password");
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    jwtSecret,
    { expiresIn: "1h" }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};
