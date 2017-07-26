const router = require('express').Router();
const winston = require('winston');

class BaseRouter {
    constructor() {
        this.httpCodes = {
            OK: 200,
            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            FORBIDDEN: 403,
            NOT_FOUND: 404,
            INTERNAL_SERVER_ERROR: 500,
        };
        this.defaultResponses = {
            200: 'OK',
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error',
        };
    }

    handleResponse(res, response) {
        if (typeof response === 'number') return res.status(response).json({ status: response, message: this.defaultResponses[response] });
        if (!response.status) response.status = 200;
        if (response.status !== 200 && !response.message) response.message = this.defaultResponses[response.status];
        res.status(response.status).json(response);
    }

    wrapHandler(handler) {
        return async(req, res) => {
            try {
                this.handleResponse(res, await handler(req, res));
            } catch (e) {
                winston.error(e);
                this.handleResponse(res, 500);
            }
        };
    }

    all(path, handler) {
        return router.all(path, this.wrapHandler(handler));
    }

    get(path, handler) {
        return router.get(path, this.wrapHandler(handler));
    }

    post(path, handler) {
        return router.post(path, this.wrapHandler(handler));
    }

    put(path, handler) {
        return router.put(path, this.wrapHandler(handler));
    }

    delete(path, handler) {
        return router.delete(path, this.wrapHandler(handler));
    }

    router() {
        return router;
    }
}

module.exports = BaseRouter;
