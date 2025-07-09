import { jest } from '@jest/globals';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import errorHandler from '@utils/helpers/errorHandler.js';
import CustomError from '@utils/helpers/CustomError.js';
import AuthenticationError from '@utils/errors/AuthenticationError.js';
import TokenExpiredError from '@utils/errors/TokenExpiredError.js';
import CommonResponse from '@utils/helpers/CommonResponse.js';

jest.mock('@utils/helpers/CommonResponse.js');

describe('errorHandler', () => {
    let req;
    let res;
    const next = jest.fn();

    beforeEach(() => {
        req = { path: '/test', requestId: 'test-req-id' };
        res = {};
        CommonResponse.error.mockClear();
    });

    it('deve lidar com ZodError e retornar 400 validationError', () => {
        const fakeError = new ZodError([{ path: ['field'], message: 'Invalid value' }]);
        process.env.NODE_ENV = 'development';
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            null,
            [{ path: 'field', message: 'Invalid value' }],
            'Erro de validação. 1 campo(s) inválido(s).'
        );
    });

    it('deve lidar com erro de chave duplicada do MongoDB e retornar 409 duplicateEntry', () => {
        const fakeError = { code: 11000, keyValue: { email: 'test@example.com' } };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            409,
            'duplicateEntry',
            'email',
            [{ path: 'email', message: 'O valor "test@example.com" já está em uso.' }],
            'Entrada duplicada no campo "email".'
        );
    });

    it('deve lidar com Mongoose ValidationError e retornar 400 validationError', () => {
        const fakeMongooseError = new mongoose.Error.ValidationError();
        fakeMongooseError.errors = {
            name: { path: 'name', message: 'Name is required' },
            age: { path: 'age', message: 'Age must be a number' }
        };

        errorHandler(fakeMongooseError, req, res, next);
        const detalhes = [
            { path: 'name', message: 'Name is required' },
            { path: 'age', message: 'Age must be a number' }
        ];

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            null,
            detalhes
        );
    });

    it('deve lidar com AuthenticationError e TokenExpiredError', () => {
        const authError = new AuthenticationError('Not authenticated', 401);
        errorHandler(authError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            authError.statusCode,
            'authenticationError',
            null,
            [{ message: authError.message }],
            authError.message
        );

        CommonResponse.error.mockClear();
        const tokenError = new TokenExpiredError('Token expired', 401);
        errorHandler(tokenError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            tokenError.statusCode,
            'authenticationError',
            null,
            [{ message: tokenError.message }],
            tokenError.message
        );
    });

    it('deve lidar com CustomError com errorType tokenExpired', () => {
        const fakeError = new CustomError({
            errorType: 'tokenExpired',
            statusCode: 401,
            customMessage: 'Seu token expirou. Faça login novamente.'
        });
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            401,
            'tokenExpired',
            null,
            [{ message: 'Seu token expirou. Faça login novamente.' }],
            'Seu token expirou. Faça login novamente.'
        );
    });

    it('deve lidar com erros operacionais', () => {
        const fakeError = new Error('Operational failure');
        fakeError.isOperational = true;
        fakeError.statusCode = 422;
        fakeError.errorType = 'operationalError';
        fakeError.details = [{ message: 'Detail info' }];
        fakeError.customMessage = 'Operacional Falhou';
        fakeError.field = 'someField';

        errorHandler(fakeError, req, res, next);
        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            422,
            'operationalError',
            'someField',
            [{ message: 'Detail info' }],
            'Operacional Falhou'
        );
    });

    it('deve lidar com erros não operacionais como erros internos', () => {
        const fakeError = new Error('Internal error occurred');
        process.env.NODE_ENV = 'development';
        errorHandler(fakeError, req, res, next);

        const callArgs = CommonResponse.error.mock.calls[0];
        expect(callArgs[0]).toBe(res);
        expect(callArgs[1]).toBe(500);
        expect(callArgs[2]).toBe('serverError');
        expect(callArgs[4][0].message).toBe(fakeError.message);
        expect(callArgs[4][0].stack).toBeDefined();
    });

    it('deve lidar com diferentes tipos de erro', () => {
        errorHandler('erro string', req, res, next);
        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            500,
            'serverError',
            null,
            [{ message: undefined, stack: undefined }]
        );

        CommonResponse.error.mockClear();
        expect(() => errorHandler(null, req, res, next)).toThrow(TypeError);

        CommonResponse.error.mockClear();
        errorHandler({}, req, res, next);
        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            500,
            'serverError',
            null,
            [{ message: undefined, stack: undefined }]
        );
    });

    it('deve lidar com erro com statusCode mas sem errorType', () => {
        const err = { statusCode: 418, message: 'I am a teapot' };
        errorHandler(err, req, res, next);
        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            500,
            'serverError',
            null,
            [{ message: 'I am a teapot', stack: undefined }]
        );
    });
});

