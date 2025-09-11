import Mailjet from "node-mailjet";

import 'dotenv/config';
require('dotenv').config();

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from "../src/database/initialConfig";


//Get all the Artist from the table
//Send email using mailjet one by one
async function send_email(mailjet, name, email, loginUrl) {
    // Resolve path to scripts/assets/politicozen-logo.png

    const __dirname = path.dirname(__filename);
    const logoPath = path.resolve(__dirname, './assets/LogoBlack.png');

    // Load once (so you don't re-read for every recipient)
    const LOGO_BASE64 = (await readFile(logoPath)).toString('base64');

    try {
        const res = await mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: 'support@politicozen.com',
                            Name: 'verified sender',
                        },
                        To: [
                            {
                                Email: email,            // ✅ use the function param
                                Name: email.split('@')[0], // ✅ Mailjet needs "Name" (capital N)
                            },
                        ],
                        Subject: 'Confirm artist',
                        // It's good practice to include a text fallback
                        TextPart:
                            `politicozen` +
                            `If you didn’t request this, you can ignore this email.`,
                        HTMLPart: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Welcome to PoliticoZen</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, div, p, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media (prefers-color-scheme: dark) {
      body, .bg { background: #0b0c0f !important; }
      .card { background: #14161a !important; border-color: #1f232b !important; }
      .heading, .copy, .muted, .list-title { color: #f5f7fa !important; }
      .muted { color: #cbd5e1 !important; }
      .btn { background: #ffffff !important; color: #000000 !important; }
      .hr { border-color: #2a3039 !important; }
      .kicker { color: #94a3b8 !important; }
      .badge { background: #222733 !important; color: #e5e7eb !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f6f7f9; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <!-- Preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#f6f7f9; opacity:0;">
    Your temporary login is ready — log in and personalize your profile.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="bg" style="background:#f6f7f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;">
          <tr>
            <td class="card" style="background:#ffffff; border:1px solid #eceff3; border-radius:12px; box-shadow:0 2px 8px rgba(16,24,40,.04);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="height:24px; line-height:24px;">&nbsp;</td></tr>
              </table>

              <!-- Brand: logo + wordmark -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:0 24px 8px;">
     <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
              <tr>
                <td style="line-height:1;">
                  <img src="cid:politicozen-logo" width="28" height="28" alt="PoliticoZen logo"
                       style="display:block;border:0;outline:0;height:28px;width:28px;border-radius:6px;">
                </td>
                <td width="10" style="font-size:0;line-height:0;">&nbsp;</td>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:800; font-size:22px; letter-spacing:.2px; color:#111111;">
                  PoliticoZen
                </td>
              </tr>
            </table>
                    <div class="kicker" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#6b7280; font-size:12px; margin-top:6px;">
                      Social reality, punching back.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="padding:16px 24px;"><div class="hr" style="border-top:1px solid #eef2f7; line-height:1px; height:1px;">&nbsp;</div></td></tr>
              </table>

              <!-- Intro -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:4px 24px 0;">
                    <p class="copy" style="margin:0 0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111111; font-size:16px; line-height:1.65;">
                      Hi <strong>${name}</strong>,
                    </p>
                    <h1 class="heading" style="margin:0 0 8px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111111; font-size:22px; line-height:1.35;">
                      Welcome to PoliticoZen!
                    </h1>
                    <p class="copy" style="margin:0 0 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111111; font-size:16px; line-height:1.65;">
                      We’re thrilled to have you on board and can’t wait for you to explore all the features we’ve built to help you shine. Here’s everything you need to know to get started:
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Content list -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 24px 8px;">
                    <div class="badge" style="display:inline-block; background:#FFDA79; color:#000000; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; letter-spacing:.4px; text-transform:uppercase; border-radius:999px; padding:6px 10px; margin-bottom:10px;">Getting Started</div>

                    <div class="list-title" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; color:#111111; font-size:16px; margin:0 0 6px;">
                      Secure Your Account
                    </div>
                    <p class="copy" style="margin:0 0 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#374151; font-size:15px; line-height:1.7;">
                      We’ve created a temporary "Login Link" for your account. To ensure your security, it’s important that you log in and change your password right away from Profile &rarr; Change Password.
                    </p>

                    <div class="list-title" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; color:#111111; font-size:16px; margin:22px 0 6px;">
                      Personalize Your Profile
                    </div>
                    <p class="copy" style="margin:0 0 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#374151; font-size:15px; line-height:1.7;">
                      Customize your shop to reflect your unique style! Add a cover image and include your social media links to connect with your audience seamlessly.
                    </p>

                    <div class="list-title" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; color:#111111; font-size:16px; margin:22px 0 6px;">
                      Start Creating Products
                    </div>
                    <p class="copy" style="margin:0 0 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#374151; font-size:15px; line-height:1.7;">
                      You now have the ability to create and sell products on our platform by uploading your designs. It’s quick and easy to bring your ideas to life!
                    </p>

                    <div class="list-title" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; color:#111111; font-size:16px; margin:22px 0 6px;">
                      We’re Here to Help
                    </div>
                    <p class="copy" style="margin:0 0 6px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#374151; font-size:15px; line-height:1.7;">
                      If you encounter any issues or have questions, don’t hesitate to reach out to us at
                      <a href="mailto:support@politicozen.com" style="color:#111111; text-decoration:underline;">support@politicozen.com</a>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:14px 24px 6px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${loginUrl}" style="height:48px; v-text-anchor:middle; width:280px;" arcsize="9%" fillcolor="#111111" stroke="f">
                      <w:anchorlock/>
                      <center style="color:#ffffff; font-family:Arial, sans-serif; font-size:16px; font-weight:bold;">
                        Log In to Your Account
                      </center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a class="btn" href="${loginUrl}"
                       style="display:inline-block; background:#FFDA79; color:#000000; text-decoration:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:15px; line-height:48px; height:48px; border-radius:6px; padding:0 22px; min-width:220px; text-align:center;">
                      Log In to Your Account
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:6px 24px 18px;">
                    <p class="muted" style="margin:10px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#6b7280; font-size:13px; line-height:1.6;">
                      Tip: After signing in, head to <em>Profile → Change Password</em> to change your password.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Closing -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 24px 8px;">
                    <p class="copy" style="margin:0 0 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111111; font-size:16px; line-height:1.65;">
                      We’re excited to see what you create and how you use PoliticoZen to share your vision.
                    </p>
                    <p class="copy" style="margin:0 0 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111111; font-size:16px; line-height:1.65;">
                      Best regards,<br>
                      <strong>The PoliticoZen Team</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:0 24px 24px;">
                    <div class="hr" style="border-top:1px solid #eef2f7; line-height:1px; height:1px; margin-bottom:12px;">&nbsp;</div>
                    <p class="muted" style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#6b7280; font-size:12px; line-height:1.6;">
                      © 2025 PoliticoZen · <a href="https://app.politicozen.com" style="color:#6b7280; text-decoration:underline;">app.politicozen.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
                        InlinedAttachments: [
                            {
                                ContentType: 'image/png',               // or image/jpeg
                                Filename: 'LogoBlack.pnh',
                                ContentID: 'politicozen-logo',          // must match cid: above
                                Base64Content: LOGO_BASE64
                            }
                        ]
                    },
                ],
            });

        // console.log('Mailjet response:', res.body);
        return true;
    } catch (err: any) {
        // Mailjet can return rich error info here:
        console.error('Mailjet error status:', err?.statusCode || '(none)');
        console.error('Mailjet error body:', err?.response?.text || err);
        return false;
    }
}

const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
);

let name = "Raj";
let email = "rajm150503@gmail.com"
send_email(mailjet, name, email, "https://app.politicozen.com");