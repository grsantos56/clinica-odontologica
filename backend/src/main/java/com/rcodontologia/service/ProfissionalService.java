package com.rcodontologia.service;

import com.rcodontologia.model.Profissional;
import com.rcodontologia.model.enums.AreaAtendimento;
import com.rcodontologia.model.enums.TipoProfissional;
import com.rcodontologia.model.enums.UserStatus;
import com.rcodontologia.repository.ProfissionalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class ProfissionalService {

    private final ProfissionalRepository profissionalRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public ProfissionalService(
            ProfissionalRepository profissionalRepository,
            FileStorageService fileStorageService,
            PasswordEncoder passwordEncoder)
    {
        this.profissionalRepository = profissionalRepository;
        this.fileStorageService = fileStorageService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Salva ou atualiza um profissional (usado para atualizações que não envolvem foto/multipart).
     */
    @Transactional
    public Profissional salvarProfissional(Profissional profissional) {

        // 🚨 REGRA DE SEGURANÇA: Criptografa a senha se ela não estiver criptografada
        if (profissional.getPassword() != null && !profissional.getPassword().startsWith("$2a$")) {
            profissional.setPassword(passwordEncoder.encode(profissional.getPassword()));
            // Se for novo, definimos o status como ATIVA
            if (profissional.getId() == null) {
                profissional.setStatus(UserStatus.ATIVA);
            }
        } else if (profissional.getId() != null) {
            // Lógica de update: busca e mantém a senha e status existentes
            Profissional existente = profissionalRepository.findById(profissional.getId()).orElse(null);
            if (existente != null) {
                profissional.setPassword(existente.getPassword());
                profissional.setStatus(existente.getStatus());
            }
        }

        // Lógica de geração de CrmOuRegistro para ATENDENTE/ADMINISTRADOR
        if (profissional.getTipoProfissional() == TipoProfissional.ATENDENTE ||
                profissional.getTipoProfissional() == TipoProfissional.ADMINISTRADOR) {

            if (profissional.getCrmOuRegistro() == null || profissional.getCrmOuRegistro().trim().isEmpty()) {
                String prefixo = profissional.getTipoProfissional().name();
                String timestampUnico = String.valueOf(System.currentTimeMillis());
                profissional.setCrmOuRegistro(prefixo + "_" + timestampUnico);
            }
        } else {
            if (profissional.getCrmOuRegistro() == null || profissional.getCrmOuRegistro().trim().isEmpty()) {
                throw new IllegalArgumentException("O registro profissional (CRM/Registro) é obrigatório para este tipo de profissional.");
            }
        }

        return profissionalRepository.save(profissional);
    }

    // ----------------------------------------------------------------------
    // 🌟 MÉTODO: SALVAR/ATUALIZAR PROFISSIONAL COM FOTO 🌟
    // ----------------------------------------------------------------------
    @Transactional
    public Profissional salvarProfissionalComFoto(Profissional profissional, MultipartFile foto) throws IOException {

        Profissional profissionalToSave = profissional;

        if (profissional.getId() != null) {
            // Lógica de ATUALIZAÇÃO
            profissionalToSave = profissionalRepository.findById(profissional.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado para atualização."));

            // Copia os dados atualizáveis
            profissionalToSave.setNome(profissional.getNome());
            profissionalToSave.setTelefone(profissional.getTelefone());
            profissionalToSave.setCrmOuRegistro(profissional.getCrmOuRegistro());
            profissionalToSave.setAreaAtendimento(profissional.getAreaAtendimento());
            profissionalToSave.setEmail(profissional.getEmail());

            // Lógica de Senha (Atualização)
            if (profissional.getPassword() != null && !profissional.getPassword().isEmpty()) {
                profissionalToSave.setPassword(passwordEncoder.encode(profissional.getPassword()));
            }
            // Se a senha vier vazia, mantém a antiga do banco (já está no objeto recuperado pelo findById)

            profissionalToSave.setStatus(UserStatus.ATIVA);

        } else {
            // Lógica de CRIAÇÃO
            profissionalToSave.setStatus(UserStatus.ATIVA);
            profissionalToSave.setPassword(passwordEncoder.encode(profissional.getPassword()));
        }

        // 2. Processa e salva a foto (Agora no Cloudinary via FileStorageService)
        if (foto != null && !foto.isEmpty()) {
            // Aqui a mágica acontece: o FileStorageService retorna a URL https://res.cloudinary...
            String fotoUrl = fileStorageService.salvarFotoProfissional(foto);
            profissionalToSave.setFoto(fotoUrl);
        } else if (profissional.getId() != null && profissional.getFoto() != null) {
            // Se não enviou nova foto, mantém a URL antiga se foi passada
            profissionalToSave.setFoto(profissional.getFoto());
        }

        // 3. Fallback de CRM/Registro para Equipe de Apoio
        if (profissionalToSave.getTipoProfissional() == TipoProfissional.ATENDENTE ||
                profissionalToSave.getTipoProfissional() == TipoProfissional.ADMINISTRADOR) {

            if (profissionalToSave.getCrmOuRegistro() == null || profissionalToSave.getCrmOuRegistro().trim().isEmpty()) {
                String prefixo = profissionalToSave.getTipoProfissional().name();
                String timestampUnico = String.valueOf(System.currentTimeMillis());
                profissionalToSave.setCrmOuRegistro(prefixo + "_" + timestampUnico);
            }
        }

        return profissionalRepository.save(profissionalToSave);
    }

    /**
     * Lista todos os profissionais ativos.
     */
    @Transactional(readOnly = true)
    public List<Profissional> listarTodos() {
        return profissionalRepository.findAll();
    }

    /**
     * Deleta um profissional por ID.
     */
    @Transactional
    public void deletarProfissional(Long id) {
        if (!profissionalRepository.existsById(id)) {
            throw new IllegalArgumentException("Profissional com ID " + id + " não encontrado para exclusão.");
        }
        profissionalRepository.deleteById(id);
    }

    // --- MÉTODOS DE BUSCA ESPECIALIZADA ---

    @Transactional(readOnly = true)
    public List<Profissional> buscarPorArea(AreaAtendimento area) {
        return profissionalRepository.findByAreaAtendimento(area);
    }

    @Transactional(readOnly = true)
    public List<Profissional> buscarPorTipo(TipoProfissional tipo) {
        return profissionalRepository.findByTipoProfissional(tipo);
    }

    @Transactional(readOnly = true)
    public Optional<Profissional> buscarPorId(Long id) {
        return profissionalRepository.findById(id);
    }
}