import jwt, { JwtPayload } from "jsonwebtoken";
import { Session } from "@prisma/client";
import SessionDAO from "./SessionDAO";
import { generateCode } from "../../utils/generateCode";

const SECONDS_TO_MINUTE = 60;
const MINUTE_TO_HOUR = SECONDS_TO_MINUTE * 60;
const HOUR_TO_DAY = MINUTE_TO_HOUR * 24;
const DAY_TO_MONTH = HOUR_TO_DAY * 30;
const DAY_TO_YEAR = DAY_TO_MONTH * 12;

class SessionService {
  getByArtistId = async (artistId: number): Promise<Session | null> => {
    const session = await SessionDAO.getByArtistId(artistId);
    return session;
  };
  isValid = async (
    accessToken: JwtPayload,
    refreshToken: JwtPayload,
    accessTokenNoDecode: string,
    refreshTokenNoDecode: string
  ) => {
    if (!accessToken.exp || !refreshToken.exp) return false;
    if (!accessToken.code || !refreshToken.code) return false;

    const currentTime = new Date().getTime() / 1000;
    console.log(refreshToken.exp);
    const isValidRefreshToken = refreshToken.exp > currentTime;
    console.log("isValidRefreshToken", isValidRefreshToken);
    if (!isValidRefreshToken) {
      return false;
    }
    const accessCode = accessToken.code;
    const refreshCode = refreshToken.code;

    const session = await SessionDAO.getByAccessTokenAndRefreshToken(
      accessCode,
      refreshCode
    );

    if (!session) {
      return false;
    }
    const isValidAccessToken = accessToken.exp > currentTime;

    if (!isValidAccessToken) {
      const newAccessCode = generateCode();
      const newAccessToken = this.getAccessToken(newAccessCode);
      return {
        accessToken: newAccessToken,
        refreshToken: refreshTokenNoDecode,
      };
    }
    return {
      accessToken: accessTokenNoDecode,
      refreshToken: refreshTokenNoDecode,
      artistId: session.artistId,
    };
  };
  getAccessToken = (accessCode: string) => {
    const encryptedAccessCode = accessCode;
    const jwtEncryptedAccessCode = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + DAY_TO_MONTH,
        code: encryptedAccessCode,
      },
      "emDgcBoq4Vv_w2ecS-Egz"
    );
    return jwtEncryptedAccessCode;
  };
  getRefreshToken = (refreshCode: string) => {
    const encryptedRefreshCode = refreshCode;
    const jwtEncryptedRefreshCode = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + DAY_TO_YEAR,
        code: encryptedRefreshCode,
      },
      "emDgcBoq4Vv_w2ecS-Egz"
    );
    return jwtEncryptedRefreshCode;
  };

  deleteByAccessToken = async (accessToken: string) => {
    const accessTokenDecode = jwt.verify(
      accessToken,
      "emDgcBoq4Vv_w2ecS-Egz"
    ) as JwtPayload;
    await SessionDAO.deleteByAccessCode(accessTokenDecode.code);
  };
  deleteById = async (id: number) => {
    await SessionDAO.deleteById(id);
  };
}

export default new SessionService();