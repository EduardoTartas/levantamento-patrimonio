import asyncWrapper from '../../middlewares/asyncWrapper';

describe('asyncWrapper', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {};
        next = jest.fn();
    });

    it('deve chamar a função handler', async () => {
        const handler = jest.fn().mockResolvedValue('success');
        const wrappedHandler = asyncWrapper(handler);

        await wrappedHandler(req, res, next);

        expect(handler).toHaveBeenCalledWith(req, res, next);
    });

    it('deve chamar next com erro se o handler lançar uma exceção', async () => {
        const error = new Error('Test error');
        const handler = jest.fn().mockRejectedValue(error);
        const wrappedHandler = asyncWrapper(handler);

        await wrappedHandler(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('não deve chamar next se o handler resolver com sucesso', async () => {
        const handler = jest.fn().mockResolvedValue('success');
        const wrappedHandler = asyncWrapper(handler);

        await wrappedHandler(req, res, next);

        expect(next).not.toHaveBeenCalled();
    });
});

