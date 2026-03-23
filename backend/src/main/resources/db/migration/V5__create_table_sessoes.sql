CREATE TABLE IF NOT EXISTS sessoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token TEXT NOT NULL,
    ip VARCHAR(45),
    dispositivo VARCHAR(255),
    data_login DATETIME NOT NULL,
    ultima_atividade DATETIME,
    profissional_id BIGINT NOT NULL,
    CONSTRAINT fk_sessoes_profissional FOREIGN KEY (profissional_id) REFERENCES profissional(id) ON DELETE CASCADE
);