import { Router } from "express";
import { externalController } from "./externalController"

const routes = Router();

routes
    .get("/generateToken/:artistId", externalController.generateToken)
    .post("/uploadRequest", externalController.uploadRequest)
    .get("/getSales", externalController.getSales);

export const externalRoute = routes;