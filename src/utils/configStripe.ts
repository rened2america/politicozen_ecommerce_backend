import Stripe from "stripe";

export const connectionStripe = () => {
  //@ts-ignore
  return new Stripe(process.env.STRIPE_KEY, {
    apiVersion: process.env.STRIPE_API_VERSION,
  });
};
