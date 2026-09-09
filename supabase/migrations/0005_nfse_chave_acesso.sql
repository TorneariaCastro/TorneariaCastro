-- A NFS-e nacional identifica cada nota por uma "chave de acesso" de 50
-- caracteres, devolvida na emissão. É ela que permite consultar e cancelar
-- a nota depois. Sem guardar isso, a nota emitida vira um beco sem saída.
alter table notas_fiscais
  add column chave_acesso text;
