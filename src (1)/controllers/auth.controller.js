const { loginUser, registerUser } = require("../services/auth.service");

exports.login = async (req, res) => {
  try {
    const data = await loginUser(req.body);
    res.json(data);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const data = await registerUser(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
