"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCode = void 0;
const nanoid_1 = require("nanoid");
const generateCode = () => {
    return (0, nanoid_1.nanoid)();
};
exports.generateCode = generateCode;
