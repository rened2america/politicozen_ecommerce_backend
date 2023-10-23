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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { Session } from "@prisma/client";
const SessionDAO_1 = __importDefault(require("./SessionDAO"));
const generateCode_1 = require("../../utils/generateCode");
const SECONDS_TO_MINUTE = 60;
const MINUTE_TO_HOUR = SECONDS_TO_MINUTE * 60;
const HOUR_TO_DAY = MINUTE_TO_HOUR * 24;
const DAY_TO_MONTH = HOUR_TO_DAY * 30;
const DAY_TO_YEAR = DAY_TO_MONTH * 12;
console.log(DAY_TO_YEAR);
class SessionService {
    constructor() {
        this.getByArtistId = (artistId) => __awaiter(this, void 0, void 0, function* () {
            const session = yield SessionDAO_1.default.getByArtistId(artistId);
            return session;
        });
        this.isValid = (accessToken, refreshToken, accessTokenNoDecode, refreshTokenNoDecode) => __awaiter(this, void 0, void 0, function* () {
            if (!accessToken.exp || !refreshToken.exp)
                return false;
            if (!accessToken.code || !refreshToken.code)
                return false;
            const currentTime = new Date().getTime() / 1000;
            console.log(refreshToken.exp);
            const isValidRefreshToken = refreshToken.exp > currentTime;
            console.log("isValidRefreshToken", isValidRefreshToken);
            if (!isValidRefreshToken) {
                return false;
            }
            const accessCode = accessToken.code;
            const refreshCode = refreshToken.code;
            const session = yield SessionDAO_1.default.getByAccessTokenAndRefreshToken(accessCode, refreshCode);
            if (!session) {
                return false;
            }
            const isValidAccessToken = accessToken.exp > currentTime;
            if (!isValidAccessToken) {
                const newAccessCode = (0, generateCode_1.generateCode)();
                const newAccessToken = this.getAccessToken(newAccessCode);
                return {
                    accessToken: newAccessToken,
                    refreshToken: refreshTokenNoDecode,
                };
            }
            return {
                accessToken: accessTokenNoDecode,
                refreshToken: refreshTokenNoDecode,
                artistId: session.artistId,
            };
        });
        this.getAccessToken = (accessCode) => {
            const encryptedAccessCode = accessCode;
            const jwtEncryptedAccessCode = jsonwebtoken_1.default.sign({
                exp: Math.floor(Date.now() / 1000) + 100000,
                code: encryptedAccessCode,
            }, process.env.JWT_SECRET_KEY);
            return jwtEncryptedAccessCode;
        };
        this.getRefreshToken = (refreshCode) => {
            const encryptedRefreshCode = refreshCode;
            const jwtEncryptedRefreshCode = jsonwebtoken_1.default.sign({
                exp: Math.floor(Date.now() / 1000) + 100000,
                code: encryptedRefreshCode,
            }, process.env.JWT_SECRET_KEY);
            return jwtEncryptedRefreshCode;
        };
        this.deleteByAccessToken = (accessToken) => __awaiter(this, void 0, void 0, function* () {
            const accessTokenDecode = yield this.verifyToken(accessToken);
            yield SessionDAO_1.default.deleteByAccessCode(accessTokenDecode.code);
        });
        this.verifyToken = (accessToken) => __awaiter(this, void 0, void 0, function* () {
            if (accessToken) {
                try {
                    return jsonwebtoken_1.default.verify(accessToken, process.env.JWT_SECRET_KEY);
                }
                catch (error) {
                    return null;
                }
            }
            return null;
        });
        this.deleteById = (id) => __awaiter(this, void 0, void 0, function* () {
            yield SessionDAO_1.default.deleteById(id);
        });
    }
}
exports.default = new SessionService();
