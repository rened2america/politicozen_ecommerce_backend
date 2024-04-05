"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userRoute_1 = require("../modules/user/userRoute");
const authRoute_1 = require("../modules/auth/authRoute");
const productRoute_1 = require("../modules/product/productRoute");
const artistRoute_1 = require("../modules/artist/artistRoute");
const externalRoute_1 = require("../modules/external/externalRoute");
const router = (0, express_1.Router)();
router.use("/user", userRoute_1.userRoute);
router.use("/auth", authRoute_1.authRoute);
router.use("/product", productRoute_1.productRoute);
router.use("/artist", artistRoute_1.artistRoute);
// External Endpoint
router.use("/politicozen", externalRoute_1.externalRoute);
exports.default = router;
