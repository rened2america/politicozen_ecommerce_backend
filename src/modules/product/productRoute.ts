import { Router } from "express";
import { productController } from "./productController";
import { authValidate } from "../../middlewares/authMiddlewares";

const routes = Router();

routes.get("/create", authValidate, productController.create);

export const productRoute = routes;
