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
import authService from "./authService";
import artistDAO from "../artist/artistDAO";
const login = async (req: Request, res: Response) => {
  console.log(req.body.email, req.body.password);

  const payload = {
    email: req.body.email,
    password: req.body.password,
  };

  const artistExist = await artistService.getArtistByEmail(payload.email);
  if (!artistExist) {
    res.status(400).json({ message: "User not found" });
    return;
  }

  const passwordIsValid = await artistService.artistPasswordIsValid(
    payload.password,
    artistExist.password
  );
  if (!passwordIsValid) {
    res.status(400).json({ message: "Password is incorrect" });
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
        .cookie("accessToken", sessionIsValid.accessToken, {
          httpOnly: true,
          sameSite: "none" as const,
          secure: true,
        })
        .cookie("refreshToken", sessionIsValid.refreshToken, {
          httpOnly: true,
          sameSite: "none" as const,
          secure: true,
        })
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
    artistId: artistExist.id,
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
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
    })
    .status(ARTISTI_LOGIN.status)
    .json({ meesage: ARTISTI_LOGIN.message, ...responseData });
};

const loginUrl = async (req: Request, res: Response) => {
  
  const loginToken = req.body.loginToken;

  const artistExist = await artistService.getArtistByLoginToken(loginToken);
  if (!artistExist) {
    res.status(400).json({ message: "User not found" });
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
        .cookie("accessToken", sessionIsValid.accessToken, {
          httpOnly: true,
          sameSite: "none" as const,
          secure: true,
        })
        .cookie("refreshToken", sessionIsValid.refreshToken, {
          httpOnly: true,
          sameSite: "none" as const,
          secure: true,
        })
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
    artistId: artistExist.id,
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
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
    })
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

const createAccount = async (req: Request, res: Response) => {
  const user = req.body;
  // const user = {
  //   name: "Rene Alberto Meza Escamilla",
  //   email: "rame.rmeza@gmail.com",
  //   password: "emar16198",
  // };
  const userExists = await authService.userExists(user.email)
  if (userExists) {
    res.status(400).json({
      message: "User already exists"
    })
    return;
  }

  const password = user.password;
  const passwordToSave = await authService.encryptPassword(password);
  const loginToken = authService.secureRandomHex(16);
  const newUser = await authService.createUser({
    ...user,
    password: passwordToSave,
    loginToken: loginToken,
    loginUrl: `https://app.politicozen.com/${loginToken}/login`,
  });

  // const sendEmail = await authService.sendEmailConfirmation(newUser.email);
  // const sendEmailVerifyArtist = await authService.sendEmailVerifyArtist(
  //   newUser.email,
  //   newUser.name
  // );
  res.status(201).json({
    message: "user created",
    newUser,
    // sendEmail,
    // sendEmailVerifyArtist,
  });
};

const userIsLogin = async (req: Request, res: Response) => {
  res.status(200).json({
    message: "user is login",
  });
};

const sendEmailTest = async (req: Request, res: Response) => {
  await authService.sendEmailTest();

  res.status(200).json({
    message: "Mail Send",
  });
};

const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await artistService.getArtistByEmail(email);
    if (!user){
      res.status(404).json({ message: "User doesn't exist" });
      return;
    }      

    const secret = process.env.JWT + user.password;
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });

    const resetURL = `${process.env.URL_DASHBOARD}/reset-password?email=${user.email}&token=${token}`;
    console.log("Here is the reset url", resetURL)
    const sentEmail = await authService.sendPasswordResetEmail(email, resetURL);    
    if(sentEmail){
      res.status(200).json({ message: 'Password reset link sent' });
      return;
    }else{
      res.status(500).json({ message: 'Caught: Something went wrong. Please contact support if this issue persists' });
      return;
    }
  } catch (error) {
    console.log("error: ", error)
    res.status(500).json({ message: 'Something went wrong. Please contact support if this issue persists' });
    return;
  }
};

const resetPassword = async (req: Request, res: Response) => {  
  const { email, password, token  } = req.body;

  try {
    const user = await artistService.getArtistByEmail(email);
    if (!user) {
      res.status(400).json({ message: "User not exists!" });
      return;
    }

    const secret = process.env.JWT + user.password;

    const verify = jwt.verify(token, secret);

    const encryptedPassword = await authService.encryptPassword(password);
             
    await artistDAO.updateArtist(user.id, { password: encryptedPassword });      

    res.status(200).json({ message: 'Password has been reset' });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong' });
    return;
  }  
};

const loginWithDecorators = withErrorHandlingDecorator(login);
const loginUrlWithDecorators = withErrorHandlingDecorator(loginUrl);

const signoutWithDecorators = withErrorHandlingDecorator(signout);
const createAccountWithDecorators = withErrorHandlingDecorator(createAccount);
const userIsLoginWithDecorators = withErrorHandlingDecorator(userIsLogin);
const sendEmailTestWithDecorators = withErrorHandlingDecorator(sendEmailTest);
const requestPasswordResetWithDecorators = withErrorHandlingDecorator(requestPasswordReset);
const resetPasswordWithDecorators = withErrorHandlingDecorator(resetPassword);

export const authController = {
  login: loginWithDecorators,
  loginUrl: loginUrlWithDecorators,
  signout: signoutWithDecorators,
  createAccount: createAccountWithDecorators,
  userIsLogin: userIsLoginWithDecorators,
  sendEmailTest: sendEmailTestWithDecorators,
  requestPasswordReset: requestPasswordResetWithDecorators,
  resetPassword: resetPasswordWithDecorators,
};
