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
const initialConfig_1 = require("../../database/initialConfig");
class AuthDAO {
    constructor() {
        this.createUser = (data) => __awaiter(this, void 0, void 0, function* () {
            const newUser = yield initialConfig_1.prisma.artist.create({
                data,
            });
            return newUser;
        });
        this.getUserByEmail = (email) => __awaiter(this, void 0, void 0, function* () {
            const user = yield initialConfig_1.prisma.artist.findUnique({
                where: {
                    email,
                },
            });
            return user;
        });
    }
}
exports.default = new AuthDAO();
