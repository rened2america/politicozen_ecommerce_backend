import { Router } from "express";

import { userRoute } from "../modules/user/userRoute";
import { authRoute } from "../modules/auth/authRoute";
import { productRoute } from "../modules/product/productRoute";
import { artistRoute } from "../modules/artist/artistRoute";
import { externalRoute } from "../modules/external/externalRoute";

const router = Router();

router.use("/user", userRoute);
router.use("/auth", authRoute);
router.use("/product", productRoute);
router.use("/artist", artistRoute);

// External Endpoint
router.use("/politicozen", externalRoute)
export default router;
