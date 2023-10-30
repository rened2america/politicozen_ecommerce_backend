"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoute = void 0;
const express_1 = require("express");
const productController_1 = require("./productController");
const authMiddlewares_1 = require("../../middlewares/authMiddlewares");
const express_2 = __importDefault(require("express"));
// import { raw } from "body-parser";
const routes = (0, express_1.Router)();
routes
    .post("/create", authMiddlewares_1.authValidate, productController_1.productController.create)
    .get("/all", productController_1.productController.getAll)
    .get("/allByUser", authMiddlewares_1.authValidate, productController_1.productController.getByUser)
    .post("/payment", productController_1.productController.session)
    .get("/infoorders/orders", authMiddlewares_1.authValidate, productController_1.productController.getOrders)
    .post("/webhook", express_2.default.raw({ type: "application/json" }), productController_1.productController.webhook)
    .put("/", authMiddlewares_1.authValidate, productController_1.productController.update)
    .delete("/:productId", authMiddlewares_1.authValidate, productController_1.productController.delete)
    .get("/:id", productController_1.productController.getById);
exports.productRoute = routes;
