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
const bcrypt_1 = __importDefault(require("bcrypt"));
// import { Artist } from "@prisma/client";
const artistDAO_1 = __importDefault(require("./artistDAO"));
class ArtistService {
    constructor() {
        this.getArtistByEmail = (email) => __awaiter(this, void 0, void 0, function* () {
            const artistExist = yield artistDAO_1.default.getArtistByEmail(email);
            return artistExist;
        });
        this.artistPasswordIsValid = (password, passwordFromDb) => __awaiter(this, void 0, void 0, function* () {
            const isValidPassword = yield bcrypt_1.default.compare(password, passwordFromDb);
            return isValidPassword;
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
    }
}
exports.default = new ArtistService();
