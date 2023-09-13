import authDAO from "./authDAO";
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";

class AuthService {
  createUser = async (user: any) => {
    const newUser = await authDAO.createUser(user);
    return newUser;
  };

  encryptPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  };
  isValidPassword = async (email: string, password: string) => {
    const user = await authDAO.getUserByEmail(email);
    if (!user) {
      return false;
    }
    const userPassword = user.password;

    if (userPassword) {
      return false;
    }
    const isValidPassword = await bcrypt.compare(password, userPassword);

    return isValidPassword;
  };

  sendEmailConfirmation = async (email: string) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const msg = {
      to: email, // Change to your recipient
      from: "renemeza.escamilla@gmail.com", // Change to your verified sender
      subject: "Sending with SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    };

    const emailSent = await sgMail.send(msg);
    return emailSent;
  };

  sendEmailVerify = async (email: string) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const msg = {
      to: email, // Change to your recipient
      from: "renemeza.escamilla@gmail.com", // Change to your verified sender
      subject: "Sending with SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    };

    const emailSent = await sgMail.send(msg);
    return emailSent;
  };
}

export default new AuthService();
