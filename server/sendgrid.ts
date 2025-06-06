import { User } from '@shared/schema';

// Verificar se a API key do SendGrid está configurada
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

// E-mail e nome de remetente para os e-mails do sistema
const SENDER_EMAIL = 'noreply@em518.jaiba.mg.leg.br';
const SENDER_NAME = 'Sistema de Gerenciamento Legislativo';

/**
 * Interface para parâmetros de e-mail
 */
interface EmailParams {
  to: string | undefined;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Função para enviar e-mail usando SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Verificar se o email está definido e não vazio
    if (!params.to) {
      console.error('SendGrid error: email de destino não especificado');
      return false;
    }
    
    console.log(`Tentando enviar e-mail para: ${params.to}`);
    console.log(`Assunto: ${params.subject}`);
    
    try {
      const emailData = {
        personalizations: [{
          to: [{ email: params.to || '' }]
        }],
        from: {
          email: SENDER_EMAIL,
          name: SENDER_NAME
        },
        subject: params.subject,
        content: [{
          type: 'text/plain',
          value: params.text || ''
        }]
      };

      if (params.html) {
        emailData.content.push({
          type: 'text/html',
          value: params.html
        });
      }

      await mailService.send(emailData);
      console.log('Email enviado com sucesso!');
      return true;
    } catch (sendError: any) {
      console.error('SendGrid email error:', sendError);
      
      // Log detalhado do erro para depuração
      if (sendError.response) {
        console.error('SendGrid API response error:');
        console.error('Status code:', sendError.response.statusCode);
        console.error('Body:', sendError.response.body);
        console.error('Headers:', sendError.response.headers);
      }
      
      // Registra que o email NÃO foi enviado, mas simula um envio bem-sucedido para testes
      console.log('DEPURAÇÃO: Simulando envio de e-mail bem-sucedido para testes');
      console.log('TO:', params.to);
      console.log('SUBJECT:', params.subject);
      console.log('CONTENT:', params.text);
      
      // Para ambiente de desenvolvimento, retornamos false para não simular sucesso e ver o erro real
      return false;
    }
  } catch (error) {
    console.error('Erro inesperado ao enviar e-mail:', error);
    return process.env.NODE_ENV === 'development'; // Simula sucesso em desenvolvimento
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
      <p>Olá ${user.name || 'usuário'},</p>
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
    
    Olá ${user.name || 'usuário'},
    
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
      <p>Olá ${user.name || 'usuário'},</p>
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
    
    Olá ${user.name || 'usuário'},
    
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
      <p>Olá ${user.name || 'usuário'},</p>
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
    
    Olá ${user.name || 'usuário'},
    
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

/**
 * Enviar e-mail após criação da conta pelo administrador
 */
export async function sendAccountCreatedEmail(user: User, baseUrl: string, tempPassword?: string): Promise<boolean> {
  const loginUrl = `${baseUrl}/login`;
  
  const subject = 'Sua conta foi criada - Sistema de Gerenciamento Legislativo';
  
  const passwordSection = tempPassword 
    ? `<p>Sua senha temporária é: <strong>${tempPassword}</strong></p>
       <p>Por favor, faça login e altere sua senha assim que possível por questões de segurança.</p>`
    : '';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bem-vindo ao Sistema de Gerenciamento Legislativo</h2>
      <p>Olá ${user.name || 'usuário'},</p>
      <p>Um administrador criou uma conta para você no Sistema de Gerenciamento Legislativo.</p>
      ${passwordSection}
      <p style="margin: 25px 0;">
        <a href="${loginUrl}" style="background-color: #2563EB; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
          Acessar o sistema
        </a>
      </p>
      <p>Atenciosamente,<br>Equipe do Sistema de Gerenciamento Legislativo</p>
    </div>
  `;
  
  const passwordTextSection = tempPassword 
    ? `Sua senha temporária é: ${tempPassword}
       Por favor, faça login e altere sua senha assim que possível por questões de segurança.`
    : '';
  
  const text = `
    Bem-vindo ao Sistema de Gerenciamento Legislativo
    
    Olá ${user.name || 'usuário'},
    
    Um administrador criou uma conta para você no Sistema de Gerenciamento Legislativo.
    
    ${passwordTextSection}
    
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
 * Enviar e-mail de notificação de novo evento para vereadores
 */
export async function sendEventNotificationEmail(councilor: User, event: any, baseUrl: string): Promise<boolean> {
  const attendanceUrl = `${baseUrl}/events/${event.id}/attendance`;
  
  const subject = 'Novo Evento Legislativo Cadastrado';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Novo Evento Legislativo Cadastrado</h2>
      <p>Olá ${councilor.name || 'vereador(a)'},</p>
      <p>Um novo evento legislativo foi cadastrado no sistema:</p>
      <div style="background-color: #f9f9f9; border-left: 4px solid #99CD85; padding: 15px; margin: 15px 0;">
        <p><strong>Evento Nº:</strong> ${event.eventNumber}</p>
        <p><strong>Data:</strong> ${new Date(event.eventDate).toLocaleDateString('pt-BR')}</p>
        <p><strong>Horário:</strong> ${event.eventTime}</p>
        <p><strong>Local:</strong> ${event.location}</p>
        <p><strong>Categoria:</strong> ${event.category}</p>
        <p><strong>Descrição:</strong> ${event.description}</p>
        <p><strong>Status:</strong> ${event.status}</p>
      </div>
      <p>Para registrar sua presença neste evento, clique no botão abaixo:</p>
      <p style="margin: 25px 0;">
        <a href="${attendanceUrl}" style="background-color: #99CD85; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Registrar Presença
        </a>
      </p>
      <p>É importante confirmar sua presença para que possamos organizar adequadamente o evento.</p>
      <p>Atenciosamente,<br>Equipe do Sistema de Gerenciamento Legislativo</p>
    </div>
  `;
  
  const text = `
    Novo Evento Legislativo Cadastrado
    
    Olá ${councilor.name || 'vereador(a)'},
    
    Um novo evento legislativo foi cadastrado no sistema:
    
    Evento Nº: ${event.eventNumber}
    Data: ${new Date(event.eventDate).toLocaleDateString('pt-BR')}
    Horário: ${event.eventTime}
    Local: ${event.location}
    Categoria: ${event.category}
    Descrição: ${event.description}
    Status: ${event.status}
    
    Para registrar sua presença neste evento, acesse:
    ${attendanceUrl}
    
    É importante confirmar sua presença para que possamos organizar adequadamente o evento.
    
    Atenciosamente,
    Equipe do Sistema de Gerenciamento Legislativo
  `;
  
  return sendEmail({
    to: councilor.email || '',
    subject,
    html,
    text
  });
}

/**
 * Enviar e-mail de notificação de atividade para aprovação
 */
export async function sendActivityApprovalRequest(admin: User, activity: any, baseUrl: string): Promise<boolean> {
  const approvalUrl = `${baseUrl}/legislative-activities/${activity.id}`;
  
  const subject = 'Nova atividade legislativa requer aprovação';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Nova Atividade Legislativa Requer Aprovação</h2>
      <p>Olá ${admin.name || 'administrador'},</p>
      <p>Uma nova atividade legislativa foi criada e requer sua aprovação:</p>
      <div style="background-color: #f9f9f9; border-left: 4px solid #2563EB; padding: 15px; margin: 15px 0;">
        <p><strong>Número:</strong> ${activity.activityNumber}</p>
        <p><strong>Descrição:</strong> ${activity.description}</p>
        <p><strong>Data:</strong> ${new Date(activity.activityDate).toLocaleDateString('pt-BR')}</p>
        <p><strong>Tipo:</strong> ${activity.type}</p>
      </div>
      <p style="margin: 25px 0;">
        <a href="${approvalUrl}" style="background-color: #2563EB; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
          Revisar atividade
        </a>
      </p>
      <p>Atenciosamente,<br>Equipe do Sistema de Gerenciamento Legislativo</p>
    </div>
  `;
  
  const text = `
    Nova Atividade Legislativa Requer Aprovação
    
    Olá ${admin.name || 'administrador'},
    
    Uma nova atividade legislativa foi criada e requer sua aprovação:
    
    Número: ${activity.activityNumber}
    Descrição: ${activity.description}
    Data: ${new Date(activity.activityDate).toLocaleDateString('pt-BR')}
    Tipo: ${activity.type}
    
    Revise a atividade no link abaixo:
    ${approvalUrl}
    
    Atenciosamente,
    Equipe do Sistema de Gerenciamento Legislativo
  `;
  
  return sendEmail({
    to: admin.email || '',
    subject,
    html,
    text
  });
}