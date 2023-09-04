import jwt from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import sessionService from "../modules/auth/sessionService";

export const authValidate: any = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validar si el token ya expiro
    // validad si el accesCode es valido
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken || !refreshToken) {
      res.status(401).json({ message: "User not logged in" });
      return;
    }
    // //"emDgcBoq4Vv_w2ecS-Egz"
    // jwt.verify(refreshToken, "emDgcBoq4Vv_w2ecS-Egz");
    // jwt.verify(accessToken, "emDgcBoq4Vv_w2ecS-Egz");
    console.log("Decode");
    const accessTokenDecode = jwt.decode(accessToken);
    const refreshTokenDecode = jwt.decode(refreshToken);
    console.log(accessTokenDecode, refreshTokenDecode);

    console.log("String");

    if (
      !accessTokenDecode ||
      typeof accessTokenDecode === "string" ||
      !refreshTokenDecode ||
      typeof refreshTokenDecode === "string"
    ) {
      res.status(401).json({ message: "User not logged in" });
      return;
    }
    console.log("after String");

    const sessionIsValid = await sessionService.isValid(
      accessTokenDecode,
      refreshTokenDecode,
      accessToken,
      refreshToken
    );
    if (sessionIsValid) {
      if (sessionIsValid.artistId) {
        req.user = {
          artistId: sessionIsValid.artistId,
        };
      }
      res
        .cookie("accessToken", sessionIsValid.accessToken, {
          httpOnly: true,
        })
        .cookie("refreshToken", sessionIsValid.refreshToken, {
          httpOnly: true,
        });
      return next();
    }
    res.status(401).send("Hubo un problema");
  } catch (error) {
    console.log(error);
  }
};
