"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthCookie {
    constructor() {
        this.getAccessCode = (accessToken) => {
            const accessCode = jsonwebtoken_1.default.decode(accessToken);
            return accessCode;
        };
        this.getRefreshCode = () => { };
        this.getAccessCodeOptions = () => { };
        this.getRefreshTokenOptions = () => { };
        this.getAccessToken = (accessCode) => {
            const encryptedAccessCode = accessCode;
            const jwtEncryptedAccessCode = jsonwebtoken_1.default.sign({
                exp: Math.floor(Date.now() / 1000) + 60,
                code: encryptedAccessCode,
            }, process.env.JWT_SECRET_KEY);
            return jwtEncryptedAccessCode;
        };
        this.getRefreshToken = (refreshCode) => {
            const encryptedRefreshCode = refreshCode;
            const jwtEncryptedRefreshCode = jsonwebtoken_1.default.sign({
                exp: Math.floor(Date.now() / 1000) + 120,
                code: encryptedRefreshCode,
            }, process.env.JWT_SECRET_KEY);
            return jwtEncryptedRefreshCode;
        };
    }
}
exports.default = new AuthCookie();
