package com.rcodontologia.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rcodontologia.config.security.jwt.JwtTokenProvider;
import com.rcodontologia.dto.*;
import com.rcodontologia.model.Profissional;
import com.rcodontologia.model.Sessao;
import com.rcodontologia.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Endpoints para registro, login, sessões e recuperação de senha")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;
    private final ObjectMapper objectMapper;

    public AuthController(AuthService authService, JwtTokenProvider tokenProvider, ObjectMapper objectMapper) {
        this.authService = authService;
        this.tokenProvider = tokenProvider;
        this.objectMapper = objectMapper;
    }

    @Operation(summary = "Registrar novo administrador", description = "Cria uma conta de administrador principal.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Registro iniciado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou e-mail já cadastrado")
    })
    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterAdminRequest request) {
        try {
            authService.registerAdmin(request);
            return new ResponseEntity<>("Registro iniciado. Verifique o e-mail para o código de confirmação.", HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Erro ao processar o registro.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Registrar com foto", description = "Registro de administrador com upload de foto de perfil.")
    @PostMapping(value = "/register-admin-with-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerAdminWithPhoto(
            @RequestPart("profissional") String profissionalJson,
            @RequestPart(value = "foto", required = false) MultipartFile foto) {
        try {
            RegisterAdminRequest request = objectMapper.readValue(profissionalJson, RegisterAdminRequest.class);
            authService.registerAdminWithPhoto(request, foto);
            return new ResponseEntity<>("Registro iniciado. Verifique o e-mail para o código de confirmação.", HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Confirmar conta", description = "Valida o código de ativação enviado por e-mail.")
    @PostMapping("/confirm-account")
    public ResponseEntity<?> confirmAccount(@Valid @RequestBody ConfirmationRequest request) {
        try {
            authService.confirmAccount(request);
            return new ResponseEntity<>("Conta ativada com sucesso.", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "Login", description = "Autentica o usuário e registra a nova sessão ativa.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login realizado com sucesso", content = @Content(schema = @Schema(implementation = TokenResponse.class))),
            @ApiResponse(responseCode = "401", description = "Credenciais inválidas")
    })
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        // Captura metadados da requisição para rastreio de sessão
        String ip = request.getRemoteAddr();
        String dispositivo = request.getHeader("User-Agent");
        
        String jwt = authService.login(loginRequest.getEmail(), loginRequest.getPassword(), ip, dispositivo);
        String email = tokenProvider.getUsernameFromJWT(jwt);
        Profissional profissional = authService.buscarProfissionalPorEmail(email).get();

        TokenResponse tokenResponse = new TokenResponse();
        tokenResponse.setAccessToken(jwt);
        tokenResponse.setUserId(profissional.getId());
        tokenResponse.setEmail(profissional.getEmail());
        tokenResponse.setRole(profissional.getTipoProfissional());

        return ResponseEntity.ok(tokenResponse);
    }

    @Operation(summary = "Listar sessões ativas", description = "Retorna sessões do usuário ou todas se for administrador.")
    @GetMapping("/sessoes")
    public ResponseEntity<List<SessaoResponseDTO>> listarSessoes(HttpServletRequest request) {
        String tokenAtual = tokenProvider.getJwtFromRequest(request);
        String email = tokenProvider.getUsernameFromJWT(tokenAtual);
        
        // Busca o profissional logado para verificar o cargo
        Profissional profissional = authService.buscarProfissionalPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Profissional não encontrado"));

        // Se for ADMINISTRADOR, lista tudo. Se não, lista apenas as próprias
        List<Sessao> sessoes = (profissional.getTipoProfissional() == com.rcodontologia.model.enums.TipoProfissional.ADMINISTRADOR) 
                ? authService.listarTodasSessoes() 
                : authService.listarSessoesAtivas(profissional.getId());

        List<SessaoResponseDTO> dtos = sessoes.stream().map(s -> {
            SessaoResponseDTO dto = new SessaoResponseDTO();
            dto.setId(s.getId());
            dto.setIp(s.getIp());
            dto.setDispositivo(s.getDispositivo());
            dto.setDataLogin(s.getDataLogin());
            dto.setSessaoAtual(s.getToken().equals(tokenAtual));

            // Mapeia o nome e cargo do dono daquela sessão específica
            dto.setNomeProfissional(s.getProfissional().getNome());
            dto.setTipoProfissional(s.getProfissional().getTipoProfissional().name());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @Operation(summary = "Encerrar sessão específica", description = "Força o logout de um dispositivo específico pelo ID da sessão.")
    @DeleteMapping("/sessoes/{id}")
    public ResponseEntity<Void> removerSessao(@PathVariable Long id) {
        authService.encerrarSessao(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Logout", description = "Encerra a sessão atual e remove o token do banco de dados.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        try {
            String jwt = tokenProvider.getJwtFromRequest(request);
            if (jwt != null) {
                authService.logout(jwt);
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.ok().build();
        }
    }

    @Operation(summary = "Esqueci minha senha", description = "Envia código de recuperação por e-mail.")
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.sendPasswordResetCode(request.getEmail());
            return ResponseEntity.ok("Código de recuperação enviado.");
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "Redefinir senha", description = "Altera a senha após validação do código.")
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
            return ResponseEntity.ok("Senha alterada com sucesso.");
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}