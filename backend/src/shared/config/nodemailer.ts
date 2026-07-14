import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.NODEMAILER_USER;
  const pass = process.env.NODEMAILER_PASS;

  if (!user || !pass) {
    throw new Error("NODEMAILER_USER/NODEMAILER_PASS are not defined in environment variables");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

let _transporter: nodemailer.Transporter | null = null;

export function getMailTransporter() {
  if (!_transporter) _transporter = getTransporter();
  return _transporter;
}

export const transporter = new Proxy({} as nodemailer.Transporter, {
  get(_, prop) {
    return Reflect.get(getMailTransporter(), prop);
  },
});
