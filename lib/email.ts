import nodemailer from "nodemailer";

export function criarTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function enviarEmail(para: string, assunto: string, html: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] GMAIL_USER ou GMAIL_APP_PASSWORD nao configurado");
    return { ok: false, erro: "credenciais ausentes" };
  }
  try {
    const transporter = criarTransporter();
    await transporter.sendMail({
      from: `"Painel Izzat" <${process.env.GMAIL_USER}>`,
      to: para,
      subject: assunto,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] erro ao enviar:", err);
    return { ok: false, erro: String(err) };
  }
}
