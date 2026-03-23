package com.rcodontologia.service;

import com.rcodontologia.dto.RegisterAdminRequest;
import com.rcodontologia.dto.ConfirmationRequest;
import com.rcodontologia.model.Profissional;
import com.rcodontologia.model.Sessao;
import com.rcodontologia.model.enums.TipoProfissional;
import com.rcodontologia.model.enums.UserStatus;
import com.rcodontologia.repository.ProfissionalRepository;
import com.rcodontologia.repository.SessaoRepository;
import com.rcodontologia.config.security.jwt.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthService {

    private final ProfissionalRepository profissionalRepository;
    private final SessaoRepository sessaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final FileStorageService fileStorageService;

    @Autowired
    public AuthService(
            ProfissionalRepository profissionalRepository,
            SessaoRepository sessaoRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider,
            FileStorageService fileStorageService)
    {
        this.profissionalRepository = profissionalRepository;
        this.sessaoRepository = sessaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public Profissional registerAdmin(RegisterAdminRequest request) {
        return performAdminRegistration(request, null);
    }

    @Transactional
    public Profissional registerAdminWithPhoto(RegisterAdminRequest request, MultipartFile foto) throws IOException {
        return performAdminRegistration(request, foto);
    }

    private Profissional performAdminRegistration(RegisterAdminRequest request, MultipartFile foto) {
        if (profissionalRepository.existsByTipoProfissional(TipoProfissional.ADMINISTRADOR)) {
            throw new IllegalStateException("O administrador principal já foi registrado.");
        }
        if (profissionalRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Já existe uma conta registrada com este e-mail.");
        }

        Profissional admin = new Profissional();
        admin.setNome(request.getNome());
        admin.setEmail(request.getEmail());
        admin.setCrmOuRegistro(request.getCrmOuRegistro());
        admin.setTipoProfissional(TipoProfissional.ADMINISTRADOR);
        admin.setAreaAtendimento(request.getAreaAtendimento());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));

        if (foto != null && !foto.isEmpty()) {
            try {
                String fotoUrl = fileStorageService.salvarFotoProfissional(foto);
                admin.setFoto(fotoUrl);
            } catch (IOException e) {
                System.err.println("Falha ao salvar foto do administrador: " + e.getMessage());
            }
        }

        String code = generateRandomCode();
        admin.setConfirmationCode(code);
        admin.setCodeExpiryDate(LocalDateTime.now().plusMinutes(30));
        admin.setStatus(UserStatus.PENDENTE_CONFIRMACAO);

        Profissional savedAdmin = profissionalRepository.save(admin);
        emailService.sendConfirmationEmail(admin.getEmail(), code);

        return savedAdmin;
    }

    @Transactional
    public Profissional confirmAccount(ConfirmationRequest request) {
        Profissional profissional = profissionalRepository.findByEmailAndConfirmationCode(request.getEmail(), request.getCode())
                .orElseThrow(() -> new IllegalArgumentException("Código de confirmação ou e-mail inválido."));

        if (profissional.getStatus() == UserStatus.ATIVA) {
            throw new IllegalStateException("A conta já está ativa.");
        }

        if (profissional.getCodeExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("O código de confirmação expirou.");
        }

        profissional.setStatus(UserStatus.ATIVA);
        profissional.setConfirmationCode(null);
        profissional.setCodeExpiryDate(null);

        return profissionalRepository.save(profissional);
    }

    @Transactional
    public String login(String email, String password, String ip, String dispositivo) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        Profissional profissional = profissionalRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Erro de segurança: Profissional não encontrado."));

        if (profissional.getStatus() != UserStatus.ATIVA) {
            throw new IllegalStateException("Conta pendente de confirmação ou inativa.");
        }

        String jwt = tokenProvider.generateToken(authentication);

        // Persistência da Sessão
        Sessao sessao = new Sessao();
        sessao.setToken(jwt);
        sessao.setIp(ip);
        sessao.setDispositivo(dispositivo);
        sessao.setDataLogin(LocalDateTime.now());
        sessao.setUltimaAtividade(LocalDateTime.now());
        sessao.setProfissional(profissional);
        sessaoRepository.save(sessao);

        return jwt;
    }

    public boolean isTokenAtivo(String token) {
        return sessaoRepository.findByToken(token).isPresent();
    }

    public List<Sessao> listarSessoesAtivas(Long profissionalId) {
        return sessaoRepository.findByProfissionalId(profissionalId);
    }

    @Transactional
    public void encerrarSessao(Long sessaoId) {
        sessaoRepository.deleteById(sessaoId);
    }

    public Optional<Profissional> buscarProfissionalPorEmail(String email) {
        return profissionalRepository.findByEmail(email);
    }

    @Transactional
    public void sendPasswordResetCode(String email) {
        Profissional user = profissionalRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("E-mail não encontrado em nossa base de dados."));

        String code = generateRandomCode();
        user.setConfirmationCode(code);
        user.setCodeExpiryDate(LocalDateTime.now().plusMinutes(15));
        profissionalRepository.save(user);

        emailService.sendEmail(email, "Recuperação de Senha", "Use este código: " + code);
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        Profissional user = profissionalRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (user.getConfirmationCode() == null || !user.getConfirmationCode().equals(code)) {
            throw new IllegalArgumentException("Código inválido.");
        }

        if (user.getCodeExpiryDate() != null && user.getCodeExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setConfirmationCode(null);
        user.setCodeExpiryDate(null);
        if (user.getStatus() == UserStatus.PENDENTE_CONFIRMACAO) {
            user.setStatus(UserStatus.ATIVA);
        }

        profissionalRepository.save(user);
    }

    @Transactional
    public void logout(String token) {
        if (token != null) {
            sessaoRepository.deleteByToken(token);
        }
    }

    private String generateRandomCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    public List<Sessao> listarTodasSessoes() {
        return sessaoRepository.findAll();
    }      
}