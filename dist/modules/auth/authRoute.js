"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoute = void 0;
const express_1 = require("express");
const authController_1 = require("./authController");
const routes = (0, express_1.Router)();
routes
    .post("/login", authController_1.authController.login)
    .get("/signout", authController_1.authController.signout)
    .post("/create", authController_1.authController.createAccount);
exports.authRoute = routes;
