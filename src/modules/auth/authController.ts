import { Request, Response } from "express";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import jwt from "jsonwebtoken";

import { ARTISTI_LOGIN } from "./authResponse";
import authCookie from "./authCookie";
import SessionDAO from "./SessionDAO";
import { CreateSession, SessionCreated } from "./authDTO";
import artistService from "../artist/artistService";
import sessionService from "./sessionService";
import { generateCode } from "../../utils/generateCode";
const login = async (_: Request, res: Response) => {
  const payload = {
    email: "renemeza.escamilla@gmail.com",
    password: "123456",
  };

  const artistExist = await artistService.getArtistByEmail(payload.email);
  if (!artistExist) {
    res.status(404).json({ meesage: "usuario no encontrado" });
    return;
  }

  const passwordIsValid = await artistService.artistPasswordIsValid(
    payload.password,
    artistExist.password
  );
  if (!passwordIsValid) {
    res.status(404).json({ meesage: "password incorrecta" });
    return;
  }

  const sessionExist = await sessionService.getByArtistId(artistExist.id);
  if (sessionExist) {
    const refreshTokenJwt = jwt.decode(sessionExist.refreshToken);
    const accessTokenJwt = jwt.decode(sessionExist.accessToken);

    if (!refreshTokenJwt || !accessTokenJwt) {
      return;
    }

    if (
      typeof refreshTokenJwt === "string" ||
      typeof accessTokenJwt === "string"
    ) {
      return;
    }
    const sessionIsValid = await sessionService.isValid(
      accessTokenJwt,
      refreshTokenJwt,
      sessionExist.accessToken,
      sessionExist.refreshToken
    );

    console.log("2sessionIsValid", sessionIsValid);
    if (sessionIsValid) {
      res
        .cookie("accessToken", sessionIsValid.accessToken, { httpOnly: true })
        .cookie("refreshToken", sessionIsValid.refreshToken, { httpOnly: true })
        .status(ARTISTI_LOGIN.status)
        .json({
          meesage: ARTISTI_LOGIN.message,
          extraDatos: "Se retornaron las cookies",
          sessionIsValid,
        });
      return;
    } else {
      await sessionService.deleteById(sessionExist.id);
    }
  }

  const accessCode = generateCode();
  const refreshCode = generateCode();
  const accessToken = authCookie.getAccessToken(accessCode);
  const refreshToken = authCookie.getRefreshToken(refreshCode);

  const session: CreateSession = {
    artistId: 1,
    accessCode,
    refreshCode,
    accessToken,
    refreshToken,
  };

  const sessionCreated: SessionCreated = await SessionDAO.create(session);
  console.log(sessionCreated);

  const accessCodeR = authCookie.getAccessCode(accessToken);

  const responseData = {
    accessCodeR,
    accessCode,
    refreshCode,
    refreshToken,
    accessToken,
  };
  res
    .cookie("accessToken", accessToken, { httpOnly: true })
    .cookie("refreshToken", refreshToken, { httpOnly: true })
    .status(ARTISTI_LOGIN.status)
    .json({ meesage: ARTISTI_LOGIN.message, ...responseData });
};

const signout = async (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;
  await sessionService.deleteByAccessToken(accessToken);

  res.clearCookie("accessToken").clearCookie("refreshToken").status(200).json({
    message: "Session Eliminada",
  });
};

const loginWithDecorators = withErrorHandlingDecorator(login);
const signoutWithDecorators = withErrorHandlingDecorator(signout);
export const authController = {
  login: loginWithDecorators,
  signout: signoutWithDecorators,
};
