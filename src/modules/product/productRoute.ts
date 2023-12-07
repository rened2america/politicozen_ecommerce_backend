import { Router } from "express";
import { productController } from "./productController";
import { authValidate } from "../../middlewares/authMiddlewares";
import express from "express";
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // limit file size to 10MB
  },
});
const routes = Router();

routes
  .post("/create", authValidate, productController.create)
  .get("/all", productController.getAll)
  .get("/groupRelation/section/:groupId", productController.getGroupRelation)
  .get("/groupRelation/:artist", productController.getGroupRelationByArtist)
  .get("/allByUser", authValidate, productController.getByUser)
  .post("/payment", productController.session)
  .get("/infoorders/orders", authValidate, productController.getOrders)
  .post(
    "/upload/art",
    authValidate,
    upload.single("art"),
    productController.createGroup
  )
  .get("/gallery", authValidate, productController.getGallery)
  .post(
    "/webhook",
    express.raw({ type: "application/json" }),
    productController.webhook
  )
  .put("/", authValidate, productController.update)
  .get("/unique/:id", productController.getByIdUnique)
  .delete("/:productId", authValidate, productController.delete)
  .get("/:id", productController.getById);

export const productRoute = routes;
