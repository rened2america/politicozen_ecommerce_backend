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
exports.authController = void 0;
const withErrorHandlingDecorator_1 = require("../../decorators/withErrorHandlingDecorator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authResponse_1 = require("./authResponse");
const authCookie_1 = __importDefault(require("./authCookie"));
const SessionDAO_1 = __importDefault(require("./SessionDAO"));
const artistService_1 = __importDefault(require("../artist/artistService"));
const sessionService_1 = __importDefault(require("./sessionService"));
const generateCode_1 = require("../../utils/generateCode");
const authService_1 = __importDefault(require("./authService"));
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body.email, req.body.password);
    const payload = {
        email: req.body.email,
        password: req.body.password,
    };
    const artistExist = yield artistService_1.default.getArtistByEmail(payload.email);
    if (!artistExist) {
        res.status(404).json({ meesage: "usuario no encontrado" });
        return;
    }
    const passwordIsValid = yield artistService_1.default.artistPasswordIsValid(payload.password, artistExist.password);
    if (!passwordIsValid) {
        res.status(404).json({ meesage: "password incorrecta" });
        return;
    }
    const sessionExist = yield sessionService_1.default.getByArtistId(artistExist.id);
    if (sessionExist) {
        const refreshTokenJwt = jsonwebtoken_1.default.decode(sessionExist.refreshToken);
        const accessTokenJwt = jsonwebtoken_1.default.decode(sessionExist.accessToken);
        if (!refreshTokenJwt || !accessTokenJwt) {
            return;
        }
        if (typeof refreshTokenJwt === "string" ||
            typeof accessTokenJwt === "string") {
            return;
        }
        const sessionIsValid = yield sessionService_1.default.isValid(accessTokenJwt, refreshTokenJwt, sessionExist.accessToken, sessionExist.refreshToken);
        console.log("2sessionIsValid", sessionIsValid);
        if (sessionIsValid) {
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
            })
                .status(authResponse_1.ARTISTI_LOGIN.status)
                .json({
                meesage: authResponse_1.ARTISTI_LOGIN.message,
                extraDatos: "Se retornaron las cookies",
                sessionIsValid,
            });
            return;
        }
        else {
            yield sessionService_1.default.deleteById(sessionExist.id);
        }
    }
    const accessCode = (0, generateCode_1.generateCode)();
    const refreshCode = (0, generateCode_1.generateCode)();
    const accessToken = authCookie_1.default.getAccessToken(accessCode);
    const refreshToken = authCookie_1.default.getRefreshToken(refreshCode);
    const session = {
        artistId: artistExist.id,
        accessCode,
        refreshCode,
        accessToken,
        refreshToken,
    };
    const sessionCreated = yield SessionDAO_1.default.create(session);
    console.log(sessionCreated);
    const accessCodeR = authCookie_1.default.getAccessCode(accessToken);
    const responseData = {
        accessCodeR,
        accessCode,
        refreshCode,
        refreshToken,
        accessToken,
    };
    res
        .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
    })
        .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
    })
        .status(authResponse_1.ARTISTI_LOGIN.status)
        .json(Object.assign({ meesage: authResponse_1.ARTISTI_LOGIN.message }, responseData));
});
const signout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.cookies.accessToken;
    yield sessionService_1.default.deleteByAccessToken(accessToken);
    res.clearCookie("accessToken").clearCookie("refreshToken").status(200).json({
        message: "Session Eliminada",
    });
});
const createAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.body;
    // const user = {
    //   name: "Rene Alberto Meza Escamilla",
    //   email: "rame.rmeza@gmail.com",
    //   password: "emar16198",
    // };
    const password = user.password;
    const passwordToSave = yield authService_1.default.encryptPassword(password);
    const newUser = yield authService_1.default.createUser(Object.assign(Object.assign({}, user), { password: passwordToSave }));
    // const sendEmail = await authService.sendEmailConfirmation(newUser.email);
    // const sendEmailVerifyArtist = await authService.sendEmailVerifyArtist(
    //   newUser.email,
    //   newUser.name
    // );
    res.status(201).json({
        message: "user created",
        newUser,
        // sendEmail,
        // sendEmailVerifyArtist,
    });
});
const userIsLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        message: "user is login",
    });
});
const loginWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(login);
const signoutWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(signout);
const createAccountWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(createAccount);
const userIsLoginWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(userIsLogin);
exports.authController = {
    login: loginWithDecorators,
    signout: signoutWithDecorators,
    createAccount: createAccountWithDecorators,
    userIsLogin: userIsLoginWithDecorators,
};
