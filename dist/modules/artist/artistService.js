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
const bcrypt_1 = __importDefault(require("bcrypt"));
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
    }
}
exports.default = new ArtistService();
