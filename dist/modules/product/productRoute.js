"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoute = void 0;
const express_1 = require("express");
const productController_1 = require("./productController");
// import { authValidate } from "../../middlewares/authMiddlewares";
const routes = (0, express_1.Router)();
routes
    .post("/create", productController_1.productController.create)
    .get("/all", productController_1.productController.getAll)
    .get("/allByUser", productController_1.productController.getByUser)
    .get("/:id", productController_1.productController.getById);
exports.productRoute = routes;
