import jwt from "jsonwebtoken";

class AuthCookie {
  getAccessCode = (accessToken: string) => {
    const accessCode = jwt.decode(accessToken);
    return accessCode;
  };
  getRefreshCode = () => {};

  getAccessCodeOptions = () => {};
  getRefreshTokenOptions = () => {};

  getAccessToken = (accessCode: string) => {
    const encryptedAccessCode = accessCode;
    const jwtEncryptedAccessCode = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60,
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
        exp: Math.floor(Date.now() / 1000) + 120,
        code: encryptedRefreshCode,
      },
      "emDgcBoq4Vv_w2ecS-Egz"
    );
    return jwtEncryptedRefreshCode;
  };
}

export default new AuthCookie();
