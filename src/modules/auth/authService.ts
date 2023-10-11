import jwt from "jsonwebtoken";
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
    const jwtToken = jwt.sign(
      {
        email: email,
        type: "confirmMail",
      },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: "24h" }
    );
    const msg = {
      to: email, // Change to your recipient
      from: "renemeza.escamilla@gmail.com", // Change to your verified sender
      subject: "Sending with SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Confirmation - PoliticoZen</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .content {
            text-align: center;
        }

        .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #3498db;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s;
        }

        .button:hover {
            background-color: #2980b9;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
          ${jwtToken}
            <h2>Email Confirmation</h2>
        </div>
        <div class="content">
            <p>Thank you for registering with PoliticoZen. We're excited to have you on board.</p>
            <p>Please click the button below to confirm your email address and complete your registration.</p>
            <a href="https://politicozen-backend.onrender.com/api/1/artist/${jwtToken}" class="button">Confirm Email</a> <!-- Replace 'your_link_here' with the link you want the user to go to. -->
        </div>
    </div>
</body>

</html>
`,
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
