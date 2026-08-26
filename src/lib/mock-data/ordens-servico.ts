import type { OrdemServico } from "@/lib/types";

export const ordensServicoMock: OrdemServico[] = [
  {
    id: "os_001",
    numero: "OS-2026-0041",
    clienteId: "cli_001",
    clienteNome: "Metalúrgica Serra Azul Ltda",
    status: "em_execucao",
    descricaoServico: "Usinagem de eixo cardan sob medida (aço 4140) + balanceamento dinâmico",
    maoDeObra: [
      { id: "mo_1", descricao: "Torneamento CNC", horas: 8, valorHora: 120 },
      { id: "mo_2", descricao: "Balanceamento", horas: 2, valorHora: 150 },
    ],
    materiais: [
      { id: "mt_1", descricao: "Barra de aço 4140 Ø80mm", quantidade: 1.2, unidade: "m", valorUnitario: 480 },
    ],
    dataAbertura: "2026-08-10T13:00:00.000Z",
    previsaoEntrega: "2026-08-27T18:00:00.000Z",
  },
  {
    id: "os_002",
    numero: "OS-2026-0042",
    clienteId: "cli_002",
    clienteNome: "Bombas Hidra Sul S.A.",
    status: "pronto",
    descricaoServico: "Recuperação de rotor de bomba centrífuga + solda de recomposição",
    maoDeObra: [
      { id: "mo_3", descricao: "Solda de recomposição", horas: 4, valorHora: 140 },
      { id: "mo_4", descricao: "Retífica cilíndrica", horas: 5, valorHora: 130 },
    ],
    materiais: [
      { id: "mt_2", descricao: "Eletrodo inox E308L", quantidade: 3, unidade: "kg", valorUnitario: 95 },
    ],
    dataAbertura: "2026-08-05T13:00:00.000Z",
    previsaoEntrega: "2026-08-20T18:00:00.000Z",
    dataConclusao: "2026-08-19T16:30:00.000Z",
  },
  {
    id: "os_003",
    numero: "OS-2026-0043",
    clienteId: "cli_004",
    clienteNome: "Agroferro Peças e Implementos",
    status: "orcado",
    descricaoServico: "Fabricação de 40 buchas de bronze TM23 para implemento agrícola",
    maoDeObra: [{ id: "mo_5", descricao: "Torneamento em série", horas: 12, valorHora: 110 }],
    materiais: [
      { id: "mt_3", descricao: "Barra de bronze TM23 Ø50mm", quantidade: 2.4, unidade: "m", valorUnitario: 310 },
    ],
    dataAbertura: "2026-08-18T13:00:00.000Z",
  },
  {
    id: "os_004",
    numero: "OS-2026-0044",
    clienteId: "cli_003",
    clienteNome: "Roberto Carlos Andrade",
    status: "faturado",
    descricaoServico: "Confecção de parafuso sem-fim para moinho artesanal",
    maoDeObra: [{ id: "mo_6", descricao: "Fresamento", horas: 6, valorHora: 115 }],
    materiais: [
      { id: "mt_4", descricao: "Aço 1045 Ø40mm", quantidade: 0.5, unidade: "m", valorUnitario: 220 },
    ],
    dataAbertura: "2026-07-22T13:00:00.000Z",
    dataConclusao: "2026-07-30T17:00:00.000Z",
  },
  {
    id: "os_005",
    numero: "OS-2026-0045",
    clienteId: "cli_001",
    clienteNome: "Metalúrgica Serra Azul Ltda",
    status: "rascunho",
    descricaoServico: "Avaliação de desgaste em conjunto de engrenagens redutoras",
    maoDeObra: [],
    materiais: [],
    dataAbertura: "2026-08-22T13:00:00.000Z",
  },
];
