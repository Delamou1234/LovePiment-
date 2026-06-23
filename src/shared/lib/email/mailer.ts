import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getAdminEmail, getSmtpConfig, type SmtpConfig } from './env';

let transporter: Transporter | null = null;
let cachedConfig: SmtpConfig | null = null;

function getTransporter(config: SmtpConfig): Transporter {
  if (transporter && cachedConfig === config) return transporter;
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  cachedConfig = config;
  return transporter;
}

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const config = getSmtpConfig();
  if (!config) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 [DEV] E-mail simulé (SMTP non configuré dans .env.local)');
      console.log(`   À : ${params.to}`);
      console.log(`   Objet : ${params.subject}`);
      console.log('   Contenu :');
      console.log(params.text);
      console.log('');
      return;
    }
    throw new Error(
      'SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS requis dans .env.local)',
    );
  }

  const transport = getTransporter(config);
  await transport.sendMail({
    from: config.from,
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

export function isEmailConfigured(): boolean {
  return getSmtpConfig() !== null && Boolean(getAdminEmail());
}
