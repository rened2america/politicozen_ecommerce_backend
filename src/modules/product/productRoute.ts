import { Router } from "express";
import { productController } from "./productController";
import { authValidate } from "../../middlewares/authMiddlewares";

const routes = Router();

routes
  .post("/create", authValidate, productController.create)
  .get("/all", productController.getAll)
  .get("/allByUser", authValidate, productController.getByUser)
  .get("/:id", productController.getById)
  .post("/payment", productController.session);

export const productRoute = routes;
