const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

function checkRole(role) {
  return function (req, res, next) {
    const authorizationHeader = req.headers["authorization"];

    if (!authorizationHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authorizationHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userRole = decoded.role;
      if (userRole.trim() === role) {
        req.user = decoded;
        next();
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    });
  };
}

function generateToken(user) {
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.Role.roleName,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: "3d" }
  );
  return token;
}

function checkUserId(req, res, next) {
  const userIdFromToken = req.user.id;
  const userIdFromRequest = req.params.userId; // Adjust this based on your route structure
  console.log("userIdFromRequest", userIdFromRequest);
  console.log("userIdFromToken", userIdFromToken);
  if (userIdFromToken === parseInt(userIdFromRequest)) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: User ID mismatch" });
  }
}

function checkUserRole(requiredRole) {
  return function (req, res, next) {
    const userRole = req.user.role.roleName;

    if (userRole.trim() === requiredRole) {
      next();
    } else {
      res
        .status(403)
        .json({ message: "Forbidden: Insufficient role privileges" });
    }
  };
}

module.exports = { checkRole, generateToken, checkUserId, checkUserRole };
