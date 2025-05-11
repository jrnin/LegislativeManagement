import nodemailer from "nodemailer";
import { User } from "@shared/schema";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  auth: {
    user: process.env.SMTP_USER || "contato@hubpublico.com.br",
    pass: process.env.SMTP_PASS || "@J1r10487@",
  },
});

// System email settings
const systemEmail = process.env.SYSTEM_EMAIL || "contato@hubpublico.com.br";
const systemName = "Sistema de Gerenciamento Legislativo";

// Email templates
const emailTemplates = {
  verifyEmail: (user: User, verificationUrl: string) => ({
    subject: "Confirme seu cadastro no Sistema de Gerenciamento Legislativo",
    html: `
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
    `,
    text: `
      Bem-vindo ao Sistema de Gerenciamento Legislativo
      
      Olá ${user.name},
      
      Obrigado por se cadastrar no nosso sistema. Para confirmar seu email e ativar sua conta, por favor visite o link abaixo:
      
      ${verificationUrl}
      
      Se você não solicitou esta conta, por favor ignore este email.
      
      Atenciosamente,
      Equipe do Sistema de Gerenciamento Legislativo
    `,
  }),
  
  accountCreated: (user: User, loginUrl: string, tempPassword?: string) => ({
    subject: "Sua conta no Sistema de Gerenciamento Legislativo foi criada",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bem-vindo ao Sistema de Gerenciamento Legislativo</h2>
        <p>Olá ${user.name},</p>
        <p>Uma conta foi criada para você no Sistema de Gerenciamento Legislativo.</p>
        ${tempPassword ? `
          <p>Sua senha temporária é: <strong>${tempPassword}</strong></p>
          <p>Recomendamos que você altere esta senha após o primeiro login.</p>
        ` : ''}
        <p style="margin: 25px 0;">
          <a href="${loginUrl}" style="background-color: #2563EB; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
            Acessar o sistema
          </a>
        </p>
        <p>Atenciosamente,<br>Equipe do Sistema de Gerenciamento Legislativo</p>
      </div>
    `,
    text: `
      Bem-vindo ao Sistema de Gerenciamento Legislativo
      
      Olá ${user.name},
      
      Uma conta foi criada para você no Sistema de Gerenciamento Legislativo.
      ${tempPassword ? `
      Sua senha temporária é: ${tempPassword}
      Recomendamos que você altere esta senha após o primeiro login.
      ` : ''}
      Acesse o sistema no link abaixo:
      
      ${loginUrl}
      
      Atenciosamente,
      Equipe do Sistema de Gerenciamento Legislativo
    `,
  }),
  
  activityRequiresApproval: (user: User, activity: any, approvalUrl: string) => ({
    subject: `Atividade Legislativa Nº ${activity.activityNumber} requer aprovação`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Solicitação de Aprovação</h2>
        <p>Olá ${user.name},</p>
        <p>A atividade legislativa <strong>${activity.activityType} Nº ${activity.activityNumber}</strong> requer sua aprovação.</p>
        <p><strong>Descrição:</strong> ${activity.description}</p>
        <p><strong>Data:</strong> ${new Date(activity.activityDate).toLocaleDateString('pt-BR')}</p>
        <p style="margin: 25px 0;">
          <a href="${approvalUrl}" style="background-color: #2563EB; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
            Revisar atividade
          </a>
        </p>
        <p>Atenciosamente,<br>Equipe do Sistema de Gerenciamento Legislativo</p>
      </div>
    `,
    text: `
      Solicitação de Aprovação
      
      Olá ${user.name},
      
      A atividade legislativa ${activity.activityType} Nº ${activity.activityNumber} requer sua aprovação.
      
      Descrição: ${activity.description}
      Data: ${new Date(activity.activityDate).toLocaleDateString('pt-BR')}
      
      Revisar atividade no link:
      ${approvalUrl}
      
      Atenciosamente,
      Equipe do Sistema de Gerenciamento Legislativo
    `,
  }),
};

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(user: User, token: string, baseUrl: string) {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const template = emailTemplates.verifyEmail(user, verificationUrl);
  
  return transporter.sendMail({
    from: `"${systemName}" <${systemEmail}>`,
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send account created notification to user
 */
export async function sendAccountCreatedEmail(user: User, baseUrl: string, tempPassword?: string) {
  const loginUrl = `${baseUrl}/login`;
  
  const template = emailTemplates.accountCreated(user, loginUrl, tempPassword);
  
  return transporter.sendMail({
    from: `"${systemName}" <${systemEmail}>`,
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send activity approval request to councilors
 */
export async function sendActivityApprovalRequest(user: User, activity: any, baseUrl: string) {
  const approvalUrl = `${baseUrl}/activities/${activity.id}`;
  
  const template = emailTemplates.activityRequiresApproval(user, activity, approvalUrl);
  
  return transporter.sendMail({
    from: `"${systemName}" <${systemEmail}>`,
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
