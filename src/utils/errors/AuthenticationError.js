import CustomError  from "../helpers/CustomError.js";

// src/utils/errors/AuthenticationError.js
class AuthenticationError extends CustomError {
  constructor(message, field = null, details = null) {
    super({
      statusCode: 401,
      errorType: 'authentication',
      customMessage: message,
      field,
      details
    });
  }
}
  
export default AuthenticationError;
  