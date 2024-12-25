import { Router } from "express";
import { externalController } from "./externalController";
import { authValidate } from "../../middlewares/authMiddlewares";

const routes = Router();
routes
  .get("/generateToken", authValidate, externalController.generateToken)
  .post("/uploadRequest", externalController.uploadRequest)
  .get("/getSales", externalController.getSales)
  .get("/getAllRequests", authValidate, externalController.getAllRequests)
  .get("/getAllRequestsExternal", externalController.getAllRequestsExternal);

export const externalRoute = routes;
