import { Router } from "express";
import { authController } from "./authController";
import { authValidate } from "../../middlewares/authMiddlewares";
const routes = Router();

routes
  .post("/login", authController.login)
  .post("/loginUrl", authController.loginUrl)
  .get("/signout", authValidate, authController.signout)
  .post("/create", authController.createAccount)
  .get("/userIsLogin", authValidate, authController.userIsLogin);
// .get("/sendMailTest", authController.sendEmailTest);

export const authRoute = routes;
