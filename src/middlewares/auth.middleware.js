const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET || "dev_secret_key";

const authMiddleware = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({ message: "No token provided" });
    }

    const [scheme, actualToken] = authorization.split(" ");

    if (scheme !== "Bearer" || !actualToken) {
      return res.status(401).json({ message: "Invalid authorization format" });
    }

    const decoded = jwt.verify(actualToken, jwtSecret);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
