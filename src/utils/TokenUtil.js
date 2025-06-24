// /src/utils/TokenUtil.js
import jwt from 'jsonwebtoken';

class TokenUtil {
  generateAccessToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  }

  generateRefreshToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE_IN
    });
  }
}

export default new TokenUtil();
