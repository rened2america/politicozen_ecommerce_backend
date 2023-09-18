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
const authDAO_1 = __importDefault(require("./authDAO"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
class AuthService {
    constructor() {
        this.createUser = (user) => __awaiter(this, void 0, void 0, function* () {
            const newUser = yield authDAO_1.default.createUser(user);
            return newUser;
        });
        this.encryptPassword = (password) => __awaiter(this, void 0, void 0, function* () {
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(password, salt);
            return hashedPassword;
        });
        this.isValidPassword = (email, password) => __awaiter(this, void 0, void 0, function* () {
            const user = yield authDAO_1.default.getUserByEmail(email);
            if (!user) {
                return false;
            }
            const userPassword = user.password;
            if (userPassword) {
                return false;
            }
            const isValidPassword = yield bcrypt_1.default.compare(password, userPassword);
            return isValidPassword;
        });
        this.sendEmailConfirmation = (email) => __awaiter(this, void 0, void 0, function* () {
            mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to: email,
                from: "renemeza.escamilla@gmail.com",
                subject: "Sending with SendGrid is Fun",
                text: "and easy to do anywhere, even with Node.js",
                html: "<strong>and easy to do anywhere, even with Node.js</strong>",
            };
            const emailSent = yield mail_1.default.send(msg);
            return emailSent;
        });
        this.sendEmailVerify = (email) => __awaiter(this, void 0, void 0, function* () {
            mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to: email,
                from: "renemeza.escamilla@gmail.com",
                subject: "Sending with SendGrid is Fun",
                text: "and easy to do anywhere, even with Node.js",
                html: "<strong>and easy to do anywhere, even with Node.js</strong>",
            };
            const emailSent = yield mail_1.default.send(msg);
            return emailSent;
        });
    }
}
exports.default = new AuthService();
