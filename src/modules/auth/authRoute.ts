import { Router } from "express";
import { authController } from "./authController";
const routes = Router();

routes
  .post("/login", authController.login)
  .get("/signout", authController.signout)
  .post("/create", authController.createAccount);

export const authRoute = routes;
