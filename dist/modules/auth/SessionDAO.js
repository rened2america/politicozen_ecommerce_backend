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
// import { Session } from "@prisma/client";
const initialConfig_1 = require("../../database/initialConfig");
class SessionDAO {
    constructor() {
        this.create = (session) => __awaiter(this, void 0, void 0, function* () {
            console.log("session", session);
            const sessionCreated = yield initialConfig_1.prisma.session.create({
                data: Object.assign({}, session),
            });
            return sessionCreated;
        });
        this.getByArtistId = (artistId) => __awaiter(this, void 0, void 0, function* () {
            const session = yield initialConfig_1.prisma.session.findUnique({
                where: {
                    artistId,
                },
            });
            return session;
        });
        this.getByAccessTokenAndRefreshToken = (accessCode, refreshCode) => __awaiter(this, void 0, void 0, function* () {
            const session = yield initialConfig_1.prisma.session.findUnique({
                where: {
                    accessCode,
                    refreshCode,
                },
            });
            console.log(session);
            return session;
        });
        this.deleteByAccessCode = (accessCode) => __awaiter(this, void 0, void 0, function* () {
            const isSessionDelete = yield initialConfig_1.prisma.session.delete({
                where: {
                    accessCode,
                },
            });
            return isSessionDelete;
        });
        this.deleteById = (id) => __awaiter(this, void 0, void 0, function* () {
            yield initialConfig_1.prisma.session.delete({
                where: {
                    id,
                },
            });
        });
    }
}
exports.default = new SessionDAO();
