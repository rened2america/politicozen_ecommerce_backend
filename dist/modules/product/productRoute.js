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
const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // limit file size to 10MB
    },
});
const routes = (0, express_1.Router)();
routes
    .post("/create", authMiddlewares_1.authValidate, productController_1.productController.create)
    .get("/all", productController_1.productController.getAll)
    .get("/groupRelation", productController_1.productController.getGroupRelation)
    .get("/groupRelation/:artist", productController_1.productController.getGroupRelation)
    .get("/allByUser", authMiddlewares_1.authValidate, productController_1.productController.getByUser)
    .post("/payment", productController_1.productController.session)
    .get("/infoorders/orders", authMiddlewares_1.authValidate, productController_1.productController.getOrders)
    .post("/upload/art", authMiddlewares_1.authValidate, upload.single("art"), productController_1.productController.createGroup)
    .get("/gallery", authMiddlewares_1.authValidate, productController_1.productController.getGallery)
    .post("/webhook", express_2.default.raw({ type: "application/json" }), productController_1.productController.webhook)
    .put("/", authMiddlewares_1.authValidate, productController_1.productController.update)
    .delete("/:productId", authMiddlewares_1.authValidate, productController_1.productController.delete)
    .get("/:id", productController_1.productController.getById);
exports.productRoute = routes;
