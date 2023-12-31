"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withErrorHandlingDecorator = void 0;
const boom_1 = require("@hapi/boom");
const logger_1 = require("../configuration/logger/logger");
const withErrorHandlingDecorator = (fn) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fn(req, res);
    }
    catch (error) {
        logger_1.logger.error("Error:", error);
        // console.error("Error:", error);
        if ((0, boom_1.isBoom)(error)) {
            res.status(error.output.statusCode).json(error.output.payload);
        }
        else {
            res.status(500).json({ error: "Ha ocurrido un error en el servidor." });
        }
    }
});
exports.withErrorHandlingDecorator = withErrorHandlingDecorator;
