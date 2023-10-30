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
exports.authValidate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sessionService_1 = __importDefault(require("../modules/auth/sessionService"));
const initialConfig_1 = require("../database/initialConfig");
const authValidate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // // Validar si el token ya expiro
        // // validad si el accesCode es valido
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;
        if (!accessToken || !refreshToken) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        // //"emDgcBoq4Vv_w2ecS-Egz"
        // jwt.verify(refreshToken, "emDgcBoq4Vv_w2ecS-Egz");
        // jwt.verify(accessToken, "emDgcBoq4Vv_w2ecS-Egz");
        const accessTokenDecode = jsonwebtoken_1.default.decode(accessToken);
        const refreshTokenDecode = jsonwebtoken_1.default.decode(refreshToken);
        console.log(accessTokenDecode, refreshTokenDecode);
        console.log("String");
        console.log();
        if (!accessTokenDecode ||
            typeof accessTokenDecode === "string" ||
            !refreshTokenDecode ||
            typeof refreshTokenDecode === "string") {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        console.log("after String");
        const sessionIsValid = yield sessionService_1.default.isValid(accessTokenDecode, refreshTokenDecode, accessToken, refreshToken);
        if (sessionIsValid) {
            console.log("sessionIsValid", sessionIsValid);
            const artist = yield initialConfig_1.prisma.artist.findUnique({
                where: {
                    id: sessionIsValid.artistId,
                },
            });
            if (!(artist === null || artist === void 0 ? void 0 : artist.emailConfirmation)) {
                res.status(403).json({ message: "confirm email" });
            }
            if (!(artist === null || artist === void 0 ? void 0 : artist.verifyArtist)) {
                res.status(403).json({ message: "verify artist" });
            }
            if (sessionIsValid.artistId) {
                req.user = {
                    artistId: sessionIsValid.artistId,
                };
            }
            res
                .cookie("accessToken", sessionIsValid.accessToken, {
                httpOnly: true,
                sameSite: "none",
                secure: true,
            })
                .cookie("refreshToken", sessionIsValid.refreshToken, {
                httpOnly: true,
                sameSite: "none",
                secure: true,
            });
            return next();
        }
        res.status(401).send("Hubo un problema");
    }
    catch (error) {
        console.log(error);
    }
});
exports.authValidate = authValidate;
