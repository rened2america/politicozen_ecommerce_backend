import { Router } from "express";
import { authController } from "./authController";
const routes = Router();

routes
  .get("/login", authController.login)
  .get("/signout", authController.signout);

export const authRoute = routes;
