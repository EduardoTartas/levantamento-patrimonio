// src/utils/errors/TokenInvalidError.js
import CustomError from '../helpers/CustomError.js';
import messages from '../helpers/messages.js';

class TokenInvalidError extends CustomError {
  constructor(message = null) {
    super({
      statusCode: 401,
      errorType: 'invalidToken',
      field: 'Token',
      details: [],
      customMessage: message || messages.error.resourceNotFound('Token')
    });
  }
}

export default TokenInvalidError;
