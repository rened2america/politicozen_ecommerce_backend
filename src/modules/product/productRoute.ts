import { Router } from "express";
import { productController } from "./productController";
import { authValidate } from "../../middlewares/authMiddlewares";
import express from "express";
// import { raw } from "body-parser";
const routes = Router();

routes
  .post("/create", authValidate, productController.create)
  .get("/all", productController.getAll)
  .get("/allByUser", authValidate, productController.getByUser)
  .post("/payment", productController.session)
  .get("/infoorders/orders", authValidate, productController.getOrders)
  .post(
    "/webhook",
    express.raw({ type: "application/json" }),
    productController.webhook
  )
  .get("/:id", productController.getById);

export const productRoute = routes;
