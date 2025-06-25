import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const enviarEmail = async ({ to, subject, html }) => {
    // Cria um transportador SMTP com as configurações do servidor de e-mail
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST, 
        port: 587, 
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        }
    });
    
    // Envia o e-mail com as informações fornecidas
    const info = await transporter.sendMail({
        from: `"Sistema de Cadastro" <${process.env.EMAIL_USER}>`, // Remetente do e-mail
        to,      // Destinatário(s) do e-mail
        subject, // Assunto do e-mail
        html,    // Conteúdo do e-mail em HTML
    });

    
    console.log("E-mail enviado:", info.messageId);
}