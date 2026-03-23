package com.rcodontologia.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@Service
public class FileStorageService {

    @Autowired
    private Cloudinary cloudinary;

    // Método genérico para enviar ao Cloudinary
    private String uploadParaCloudinary(MultipartFile file, String pasta) throws IOException {
        if (file.isEmpty()) throw new IOException("Arquivo vazio.");

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("folder", pasta));

        return uploadResult.get("secure_url").toString();
    }

    public String salvarFotoProfissional(MultipartFile file) throws IOException {
        return uploadParaCloudinary(file, "profissional_fotos");
    }

    public String salvarFotoProcedimento(MultipartFile file) throws IOException {
        return uploadParaCloudinary(file, "procedimento_fotos");
    }

    // Se existir o método para paciente aqui (embora o PacienteService tenha logica própria):
    public String salvarFotoPaciente(MultipartFile file) throws IOException {
        return uploadParaCloudinary(file, "paciente_fotos");
    }
}