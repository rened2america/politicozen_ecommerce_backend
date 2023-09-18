import { Router } from "express";

import { userRoute } from "../modules/user/userRoute";
import { authRoute } from "../modules/auth/authRoute";
import { productRoute } from "../modules/product/productRoute";

const router = Router();

router.use("/user", userRoute);
router.use("/auth", authRoute);
router.use("/product", productRoute);

export default router;
