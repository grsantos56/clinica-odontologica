ALTER TABLE paciente 
ADD COLUMN recorrente BIT(1) DEFAULT 0,
ADD COLUMN dias_recorrencia INT DEFAULT 0;