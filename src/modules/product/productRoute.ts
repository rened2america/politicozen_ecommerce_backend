import { Router } from "express";
import { productController } from "./productController";
// import { authValidate } from "../../middlewares/authMiddlewares";

const routes = Router();

routes
  .post("/create", productController.create)
  .get("/all", productController.getAll)
  .get("/allByUser", productController.getByUser)
  .get("/:id", productController.getById);

export const productRoute = routes;
