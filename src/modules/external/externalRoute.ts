import { Router } from "express";
import { externalController } from "./externalController";
import { authValidate } from "../../middlewares/authMiddlewares";

const routes = Router();
routes
  .get("/generateToken", authValidate, externalController.generateToken)
  .post("/uploadRequest", externalController.uploadRequest)
  .get("/getSales", externalController.getSales)
  .get("/getAllRequests", authValidate, externalController.getAllRequests)
  .delete("/deleteRequest/:requestID", authValidate, externalController.deleteRequest)
  .get("/getAllRequestsExternal", externalController.getAllRequestsExternal);

export const externalRoute = routes;
