package com.rcodontologia.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Método genérico para envio de e-mail simples.
     * Usado para recuperação de senha e outros avisos.
     */
    public void sendEmail(String toEmail, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(text);

        // Configuração do remetente (opcional, se já estiver no application.properties)
        // message.setFrom("no-reply@rcodontologia.com");

        mailSender.send(message);
    }

    /**
     * Envia especificamente o e-mail de confirmação de cadastro.
     */
    public void sendConfirmationEmail(String toEmail, String code) {
        String subject = "Confirmação de Cadastro RC Odontologia";
        String text = "Seu código de confirmação de administrador é: " + code +
                "\n\nEste código expira em 30 minutos. Por favor, utilize-o para ativar sua conta.";

        // Reutiliza o método genérico
        sendEmail(toEmail, subject, text);
    }
}