import { MailService } from '@sendgrid/mail';
import { User } from '@shared/schema';

// Inicializar o serviço de e-mail do SendGrid
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

// E-mail e nome de remetente para os e-mails do sistema
const SENDER_EMAIL = 'noreply@sistema-legislativo.com';
const SENDER_NAME = 'Sistema de Gerenciamento Legislativo';

/**
 * Interface para parâmetros de e-mail
 */
interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Função para enviar e-mail usando SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: {
        email: SENDER_EMAIL,
        name: SENDER_NAME
      },
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Enviar e-mail de verificação para um novo usuário
 */
export async function sendVerificationEmail(user: User, token: string, baseUrl: string): Promise<boolean> {
  const verificationUrl = `${baseUrl}/api/verify-email?token=${token}`;
  
  const subject = 'Confirme seu cadastro no Sistema de Gerenciamento Legislativo';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bem-vindo ao Sistema de Gerenciamento Legislativo</h2>
      <p>Olá ${user.name},</p>
      <p>Obrigado por se cadastrar no nosso sistema. Para confirmar seu email e ativar sua conta, por favor clique no link abaixo:</p>
      <p style="margin: 25px 0;">
        <a href="${verificationUrl}" style="background-color: #2563EB; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
          Confirmar meu email
        </a>
      </p>
      <p>Se você não solicitou esta conta, por favor ignore este email.</p>
      <p>Atenciosamente,<br>Equipe do Sistema de Gerenciamento Legislativo</p>
    </div>
  `;
  
  const text = `
    Bem-vindo ao Sistema de Gerenciamento Legislativo
    
    Olá ${user.name},
    
    Obrigado por se cadastrar no nosso sistema. Para confirmar seu email e ativar sua conta, por favor visite o link abaixo:
    
    ${verificationUrl}
    
    Se você não solicitou esta conta, por favor ignore este email.
    
    Atenciosamente,
    Equipe do Sistema de Gerenciamento Legislativo
  `;
  
  return sendEmail({
    to: user.email || '',
    subject,
    html,
    text
  });
}

/**
 * Enviar e-mail de boas-vindas após a criação da conta
 */
export async function sendWelcomeEmail(user: User, baseUrl: string): Promise<boolean> {
  const loginUrl = `${baseUrl}/login`;
  
  const subject = 'Bem-vindo ao Sistema de Gerenciamento Legislativo';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bem-vindo ao Sistema de Gerenciamento Legislativo</h2>
      <p>Olá ${user.name},</p>
      <p>Sua conta foi ativada com sucesso!</p>
      <p>Agora você pode acessar o sistema e desfrutar de todos os recursos disponíveis.</p>
      <p style="margin: 25px 0;">
        <a href="${loginUrl}" style="background-color: #2563EB; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
          Acessar o sistema
        </a>
      </p>
      <p>Atenciosamente,<br>Equipe do Sistema de Gerenciamento Legislativo</p>
    </div>
  `;
  
  const text = `
    Bem-vindo ao Sistema de Gerenciamento Legislativo
    
    Olá ${user.name},
    
    Sua conta foi ativada com sucesso!
    
    Agora você pode acessar o sistema e desfrutar de todos os recursos disponíveis.
    
    Acesse o sistema no link abaixo:
    ${loginUrl}
    
    Atenciosamente,
    Equipe do Sistema de Gerenciamento Legislativo
  `;
  
  return sendEmail({
    to: user.email || '',
    subject,
    html,
    text
  });
}

/**
 * Enviar e-mail para redefinição de senha
 */
export async function sendPasswordResetEmail(user: User, token: string, baseUrl: string): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const subject = 'Redefinir sua senha - Sistema de Gerenciamento Legislativo';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Redefinição de Senha</h2>
      <p>Olá ${user.name},</p>
      <p>Recebemos uma solicitação para redefinir sua senha. Se você fez esta solicitação, clique no link abaixo para criar uma nova senha:</p>
      <p style="margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #2563EB; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
          Redefinir minha senha
        </a>
      </p>
      <p>Este link expirará em 1 hora por motivos de segurança.</p>
      <p>Se você não solicitou a redefinição de senha, ignore este e-mail e sua senha permanecerá a mesma.</p>
      <p>Atenciosamente,<br>Equipe do Sistema de Gerenciamento Legislativo</p>
    </div>
  `;
  
  const text = `
    Redefinição de Senha
    
    Olá ${user.name},
    
    Recebemos uma solicitação para redefinir sua senha. Se você fez esta solicitação, acesse o link abaixo para criar uma nova senha:
    
    ${resetUrl}
    
    Este link expirará em 1 hora por motivos de segurança.
    
    Se você não solicitou a redefinição de senha, ignore este e-mail e sua senha permanecerá a mesma.
    
    Atenciosamente,
    Equipe do Sistema de Gerenciamento Legislativo
  `;
  
  return sendEmail({
    to: user.email || '',
    subject,
    html,
    text
  });
}