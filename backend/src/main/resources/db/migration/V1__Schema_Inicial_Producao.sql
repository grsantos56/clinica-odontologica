-- V1__Schema_Inicial_Producao.sql

-- 1. Tabela Profissional (Independente)
CREATE TABLE IF NOT EXISTS profissional (
  id bigint NOT NULL AUTO_INCREMENT,
  area_atendimento enum('ODONTOLOGIA','FISIOTERAPIA','NUTRICIONISTA','PSICOLOGIA','ATENDIMENTO_GERAL') NOT NULL,
  code_expiry_date datetime(6) DEFAULT NULL,
  confirmation_code varchar(6) DEFAULT NULL,
  crm_ou_registro varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  foto varchar(255) DEFAULT NULL,
  nome varchar(100) NOT NULL,
  password varchar(100) DEFAULT NULL,
  status enum('ATIVA','PENDENTE_CONFIRMACAO','INATIVA') NOT NULL,
  telefone varchar(20) DEFAULT NULL,
  tipo_profissional enum('ADMINISTRADOR','DENTISTA','FISIOTERAPEUTA','NUTRICIONISTA','PSICOLOGO','ATENDENTE') NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_howmur2hbv2ueuij2la78edh0 (crm_ou_registro),
  UNIQUE KEY UK_6guuncqkx1katspvyj4cfsh1l (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabela Paciente (Independente)
CREATE TABLE IF NOT EXISTS paciente (
  id bigint NOT NULL AUTO_INCREMENT,
  area_atendimento enum('ODONTOLOGIA','FISIOTERAPIA','NUTRICIONISTA','PSICOLOGIA','ATENDIMENTO_GERAL') NOT NULL,
  cpf varchar(11) DEFAULT NULL,
  email varchar(100) DEFAULT NULL,
  endereco varchar(150) DEFAULT NULL,
  foto varchar(255) DEFAULT NULL,
  nascimento date NOT NULL,
  nome varchar(100) NOT NULL,
  observacoes varchar(500) DEFAULT NULL,
  retorno_solicitado bit(1) NOT NULL,
  saldo_devedor decimal(10,2) NOT NULL,
  status_financeiro enum('COM_DEBITOS_EM_ABERTO','SEM_DEBITOS','PENDENTE') NOT NULL,
  telefone varchar(20) NOT NULL,
  data_ultima_visita datetime(6) DEFAULT NULL,
  data_ultimo_orcamento datetime(6) DEFAULT NULL,
  data_ultimo_pagamento datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_fvlo8m5kqpr7knbyw4rjyer2s (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabela Serviço (Independente)
CREATE TABLE IF NOT EXISTS servico (
  id bigint NOT NULL AUTO_INCREMENT,
  area_especialidade enum('ODONTOLOGIA','FISIOTERAPIA','NUTRICIONISTA','PSICOLOGIA','ATENDIMENTO_GERAL') NOT NULL,
  comissao_percentual double NOT NULL,
  descricao varchar(500) DEFAULT NULL,
  nome varchar(100) NOT NULL,
  preco double NOT NULL,
  recomendacoes_pos_procedimento varchar(4000) DEFAULT NULL,
  requer_dente bit(1) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabela Agendamento (Depende de Paciente e Profissional)
CREATE TABLE IF NOT EXISTS agendamento (
  id bigint NOT NULL AUTO_INCREMENT,
  area enum('ODONTOLOGIA','FISIOTERAPIA','NUTRICIONISTA','PSICOLOGIA','ATENDIMENTO_GERAL') NOT NULL,
  data_hora datetime(6) NOT NULL,
  notas varchar(500) DEFAULT NULL,
  procedimento varchar(100) NOT NULL,
  status enum('PENDENTE','AGUARDANDO_RETORNO','REAGENDADO','CANCELADO','CONCLUIDO','CONCLUIDO_RETORNO') NOT NULL,
  paciente_id bigint NOT NULL,
  profissional_id bigint NOT NULL,
  PRIMARY KEY (id),
  KEY FK72wv1pjcpc2c0g6dy3yq39td7 (paciente_id),
  KEY FK4a21d2pi1rrtdt79gqf3ks9ho (profissional_id),
  CONSTRAINT FK4a21d2pi1rrtdt79gqf3ks9ho FOREIGN KEY (profissional_id) REFERENCES profissional (id),
  CONSTRAINT FK72wv1pjcpc2c0g6dy3yq39td7 FOREIGN KEY (paciente_id) REFERENCES paciente (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabela Transacao (Depende de Paciente e Profissional)
CREATE TABLE IF NOT EXISTS transacao (
  id bigint NOT NULL AUTO_INCREMENT,
  data datetime(6) NOT NULL,
  descricao varchar(255) DEFAULT NULL,
  taxa_porcentagem decimal(5,2) DEFAULT NULL,
  tipo enum('PIX','CARTAO_DEBITO','CARTAO_CREDITO','DINHEIRO','TRANSFERENCIA','CHEQUE') DEFAULT NULL,
  tipo_transacao enum('ENTRADA','SAIDA') DEFAULT NULL,
  valor decimal(10,2) NOT NULL,
  valor_liquido decimal(10,2) DEFAULT NULL,
  valor_taxa decimal(10,2) DEFAULT NULL,
  paciente_id bigint DEFAULT NULL,
  profissional_id bigint DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK9p4w6054v81euox8jkji73jyg (paciente_id),
  KEY FKdcayxtxu8sb9l3hq98x0aorox (profissional_id),
  CONSTRAINT FK9p4w6054v81euox8jkji73jyg FOREIGN KEY (paciente_id) REFERENCES paciente (id),
  CONSTRAINT FKdcayxtxu8sb9l3hq98x0aorox FOREIGN KEY (profissional_id) REFERENCES profissional (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabela Receita (Depende de Paciente e Profissional)
CREATE TABLE IF NOT EXISTS receita (
  id bigint NOT NULL AUTO_INCREMENT,
  data_emissao datetime(6) DEFAULT NULL,
  observacoes tinytext,
  paciente_id bigint NOT NULL,
  profissional_id bigint NOT NULL,
  PRIMARY KEY (id),
  KEY FKf7pyhn2uddmyy3xjqn7tc7d12 (paciente_id),
  KEY FKny82fsn1rvrf8f12lwbbf2hqg (profissional_id),
  CONSTRAINT FKf7pyhn2uddmyy3xjqn7tc7d12 FOREIGN KEY (paciente_id) REFERENCES paciente (id),
  CONSTRAINT FKny82fsn1rvrf8f12lwbbf2hqg FOREIGN KEY (profissional_id) REFERENCES profissional (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabela Item Prescrição (Depende de Receita)
CREATE TABLE IF NOT EXISTS item_prescricao (
  id bigint NOT NULL AUTO_INCREMENT,
  duracao varchar(255) DEFAULT NULL,
  frequencia varchar(255) DEFAULT NULL,
  nome_medicamento varchar(255) DEFAULT NULL,
  quantidade varchar(255) DEFAULT NULL,
  via_administracao varchar(255) DEFAULT NULL,
  receita_id bigint NOT NULL,
  PRIMARY KEY (id),
  KEY FK96xd2m0jbk52nim3pgr16pwom (receita_id),
  CONSTRAINT FK96xd2m0jbk52nim3pgr16pwom FOREIGN KEY (receita_id) REFERENCES receita (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabela Procedimento (Depende de Agendamento)
CREATE TABLE IF NOT EXISTS procedimento (
  id bigint NOT NULL AUTO_INCREMENT,
  acoes_diario_json text,
  codigo_tratamento varchar(36) DEFAULT NULL,
  data_registro datetime(6) DEFAULT NULL,
  mapa_odontograma_inicial_json text,
  mapa_odontograma_json text,
  numero_parcelas int DEFAULT NULL,
  observacoes_clinicas varchar(255) DEFAULT NULL,
  status_pagamento enum('PAGO','PARCIALMENTE_PAGO','NAO_PAGO','AGUARDANDO','EM_ATENDIMENTO','ORCAMENTO') DEFAULT NULL,
  valor_liquido double DEFAULT NULL,
  valor_pago double DEFAULT NULL,
  valor_total_lancado double DEFAULT NULL,
  agendamento_id bigint NOT NULL,
  orcamento_agendado bit(1) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_gi0jdv1cbbce860hy7adn542o (agendamento_id),
  CONSTRAINT FK29mpnmgxfyrl2ucnj3fw5es9p FOREIGN KEY (agendamento_id) REFERENCES agendamento (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabela Procedimento Fotos (Depende de Procedimento)
CREATE TABLE IF NOT EXISTS procedimento_fotos (
  procedimento_id bigint NOT NULL,
  foto_url varchar(500) DEFAULT NULL,
  KEY FKqeo2lnjkxcjkn8q0ywnqrgb4b (procedimento_id),
  CONSTRAINT FKqeo2lnjkxcjkn8q0ywnqrgb4b FOREIGN KEY (procedimento_id) REFERENCES procedimento (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabela Procedimento Item (Depende de Procedimento)
CREATE TABLE IF NOT EXISTS procedimento_item (
  id bigint NOT NULL AUTO_INCREMENT,
  acrescimo double DEFAULT NULL,
  desconto double DEFAULT NULL,
  descricao varchar(255) NOT NULL,
  valor_base double DEFAULT NULL,
  valor_liquido double DEFAULT NULL,
  procedimento_id bigint NOT NULL,
  PRIMARY KEY (id),
  KEY FKkvgb5m6aibtp3mpj9ffrmepot (procedimento_id),
  CONSTRAINT FKkvgb5m6aibtp3mpj9ffrmepot FOREIGN KEY (procedimento_id) REFERENCES procedimento (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Tabela Procedimento Realizados (Legado/Compatibilidade)
CREATE TABLE IF NOT EXISTS procedimento_procedimentos_realizados (
  procedimento_id bigint NOT NULL,
  descricao_procedimento varchar(255) DEFAULT NULL,
  KEY FKms300fhjxrjtnoombgplv51iq (procedimento_id),
  CONSTRAINT FKms300fhjxrjtnoombgplv51iq FOREIGN KEY (procedimento_id) REFERENCES procedimento (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;