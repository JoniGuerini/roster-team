import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  CATEGORIAS_TURNO,
  isRecorrenciaEscala,
  OPCOES_DIA_SEMANA_RECORRENTE,
  parseRecorrenciaEscala,
  RECORRENCIA_TODO_DIA,
  TIPOS_TURNO,
  type CategoriaTurno,
  type NecessidadeFuncao,
  type TipoTurno,
  type Turno,
  type TurnoInput,
} from '../../types/turno';
import {
  FUNCOES,
  LOCAIS_TRABALHO,
  type Funcao,
  type Funcionario,
  type LocalTrabalho,
} from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select, type SelectOption } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { TimeRange } from '../ui/TimeRange';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { calcularDuracao } from '../../utils/turnoLabels';
import { labelFuncao, labelLocal } from '../../utils/funcionarioLabels';
import { hojeISO } from '../../utils/datas';
import { proximaDataComDiaSemana } from '../../utils/alocacoesIniciaisTurno';
import {
  indisponibilidadeExtraNoDia,
  indisponibilidadeNoDia,
  podeAparecerComoSugeridoNoTurno,
} from '../../utils/disponibilidade';
import { extrasStorage } from '../../services/extrasStorage';
import '../funcionarios/FuncionarioForm.css';
import './TurnoForm.css';

interface TurnoFormProps {
  turno?: Turno;
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onCancel: () => void;
  onSubmit: (input: TurnoInput) => void;
  onExtrasChange?: () => void;
}

interface FormState {
  nome: string;
  tipo: TipoTurno | '';
  categoria: CategoriaTurno | '';
  localTrabalho: LocalTrabalho | '';
  horaInicio: string;
  horaFim: string;
  necessidades: Record<Funcao, number>;
  /** Uma posição por vaga da função; string vazia = sem sugestão. */
  sugestoesSlots: Record<Funcao, string[]>;
  /** '' ou índice 0–6 para `Date.getDay()`. Só usado quando `tipo === 'regular'`. */
  diaSemanaRecorrente: string;
  observacoes: string;
  ativo: boolean;
}

type FormErrors = Partial<
  Record<keyof FormState | 'necessidades' | 'horario', string>
>;

const NECESSIDADES_VAZIAS: Record<Funcao, number> = {
  atendente: 0,
  barista: 0,
  chapeiro: 0,
  gerente: 0,
  supervisor: 0,
};

function slotsParaQuantidades(
  necessidades: Record<Funcao, number>,
  prev?: Partial<Record<Funcao, string[]>>,
): Record<Funcao, string[]> {
  const out = {} as Record<Funcao, string[]>;
  for (const { value: f } of FUNCOES) {
    const q = necessidades[f] ?? 0;
    const old = prev?.[f] ?? [];
    out[f] = Array.from({ length: q }, (_, i) => old[i] ?? '');
  }
  return out;
}

function migrarSugestoesLegadas(
  poolIds: string[],
  necessidades: Record<Funcao, number>,
  funcionarios: Funcionario[],
  local: LocalTrabalho,
): Record<Funcao, string[]> {
  const pool = [...poolIds];
  const slots = slotsParaQuantidades(necessidades);
  for (const { value: funcao } of FUNCOES) {
    const row = slots[funcao];
    for (let i = 0; i < row.length; i++) {
      const idx = pool.findIndex((id) => {
        const f = funcionarios.find((x) => x.id === id);
        return (
          f != null &&
          f.localTrabalho === local &&
          podeAparecerComoSugeridoNoTurno(f)
        );
      });
      if (idx >= 0) {
        row[i] = pool[idx];
        pool.splice(idx, 1);
      }
    }
  }
  return slots;
}

function sanitizarSlots(
  slots: Record<Funcao, string[]>,
  necessidades: Record<Funcao, number>,
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
  local: LocalTrabalho,
): Record<Funcao, string[]> {
  const next = slotsParaQuantidades(necessidades, slots);
  const extraIds = new Set(extras.map((e) => e.id));
  for (const { value: f } of FUNCOES) {
    const row = next[f];
    for (let i = 0; i < row.length; i++) {
      const id = row[i];
      if (!id) continue;
      if (extraIds.has(id)) continue;
      const func = funcionarios.find((x) => x.id === id);
      if (
        !func ||
        func.localTrabalho !== local ||
        !podeAparecerComoSugeridoNoTurno(func)
      ) {
        row[i] = '';
      }
    }
  }
  return next;
}

function ordenarIdsDasVagas(slots: Record<Funcao, string[]>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const { value: funcao } of FUNCOES) {
    for (const id of slots[funcao] ?? []) {
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

const ESTADO_INICIAL: FormState = {
  nome: '',
  tipo: '',
  categoria: '',
  localTrabalho: '',
  horaInicio: '',
  horaFim: '',
  necessidades: { ...NECESSIDADES_VAZIAS },
  sugestoesSlots: slotsParaQuantidades(NECESSIDADES_VAZIAS),
  diaSemanaRecorrente: '',
  observacoes: '',
  ativo: true,
};

function necessidadesParaArray(
  registro: Record<Funcao, number>,
): NecessidadeFuncao[] {
  return (Object.entries(registro) as [Funcao, number][])
    .filter(([, qtd]) => qtd > 0)
    .map(([funcao, quantidade]) => ({ funcao, quantidade }));
}

function necessidadesParaRegistro(
  necessidades: NecessidadeFuncao[],
): Record<Funcao, number> {
  const base = { ...NECESSIDADES_VAZIAS };
  necessidades.forEach((n) => {
    base[n.funcao] = n.quantidade;
  });
  return base;
}

export function TurnoForm({
  turno,
  funcionarios,
  extras,
  onCancel,
  onSubmit,
  onExtrasChange,
}: TurnoFormProps) {
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erros, setErros] = useState<FormErrors>({});
  const [extraModal, setExtraModal] = useState<{
    funcao: Funcao;
    indice: number;
  } | null>(null);
  const [extraNome, setExtraNome] = useState('');

  const funcionariosCompativeis = useMemo(() => {
    const ativos = funcionarios.filter(podeAparecerComoSugeridoNoTurno);
    if (!form.localTrabalho) return ativos;
    return ativos.filter((f) => f.localTrabalho === form.localTrabalho);
  }, [funcionarios, form.localTrabalho]);

  const funcionariosDoLocalAlocacao = useMemo(() => {
    if (!form.localTrabalho) return [];
    return [...funcionarios]
      .filter((f) => f.localTrabalho === form.localTrabalho)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [funcionarios, form.localTrabalho]);

  const dataReferenciaAlocacao = useMemo(() => {
    const rec = parseRecorrenciaEscala(form.diaSemanaRecorrente);
    if (form.tipo === 'regular' && rec != null) {
      if (rec === RECORRENCIA_TODO_DIA) return hojeISO();
      return proximaDataComDiaSemana(hojeISO(), rec);
    }
    return hojeISO();
  }, [form.tipo, form.diaSemanaRecorrente]);

  function opcaoFuncionarioAlocacao(f: Funcionario): SelectOption {
    const pode = podeAparecerComoSugeridoNoTurno(f);
    const ind = indisponibilidadeNoDia(f, dataReferenciaAlocacao);
    const principal = f.funcaoPrincipal;
    const rotuloFuncao = principal ? labelFuncao(principal) : 'Sem função';
    const secundarias = [
      ...new Set(
        (f.funcoesSecundarias ?? []).filter((func) => func !== principal),
      ),
    ];
    const label = [
      f.nome,
      rotuloFuncao,
      ...secundarias.map((fn) => labelFuncao(fn)),
      !pode ? 'inativo' : '',
      ind?.rotulo ?? '',
    ]
      .filter(Boolean)
      .join(' ');
    const pills: ReactNode[] = [];
    if (!pode) pills.push(
      <Badge key="st" tone="danger">
        Inativo
      </Badge>,
    );
    else if (ind)
      pills.push(
        <Badge key="folga" tone="warning">
          {ind.rotulo}
        </Badge>,
      );
    return {
      value: f.id,
      label,
      optionContent: (
        <span className="brisa-select-option-row">
          <span className="brisa-select-option-row__person">
            <span className="brisa-select-option-row__name">{f.nome}</span>
            <span className="brisa-select-option-row__roles">
              <span className="brisa-role-chip">{rotuloFuncao}</span>
              {secundarias.map((fn) => (
                <span
                  key={fn}
                  className="brisa-role-chip brisa-role-chip--secondary"
                >
                  {labelFuncao(fn)}
                </span>
              ))}
            </span>
          </span>
          {pills.length > 0 && (
            <span className="brisa-select-option-row__pills">{pills}</span>
          )}
        </span>
      ),
      disabled: !pode,
    };
  }

  function opcaoExtraAlocacao(e: PessoaExtra): SelectOption {
    const st = e.status ?? 'ativo';
    const pode = st === 'ativo';
    const ind = indisponibilidadeExtraNoDia(e, dataReferenciaAlocacao);
    const principal = e.funcaoPrincipal ?? null;
    const chipPrincipal = principal ? labelFuncao(principal) : null;
    const secundarias = [
      ...new Set(
        (e.funcoesSecundarias ?? []).filter((fn) => fn !== principal),
      ),
    ];
    const label = [
      e.nome,
      chipPrincipal ?? 'Extra',
      ...secundarias.map((fn) => labelFuncao(fn)),
      !pode ? 'inativo' : '',
      ind?.rotulo ?? '',
    ]
      .filter(Boolean)
      .join(' ');
    const pills: ReactNode[] = [];
    if (!pode)
      pills.push(
        <Badge key="st" tone="danger">
          Inativo
        </Badge>,
      );
    else if (ind)
      pills.push(
        <Badge key="folga" tone="warning">
          {ind.rotulo}
        </Badge>,
      );
    return {
      value: e.id,
      label,
      optionContent: (
        <span className="brisa-select-option-row">
          <span className="brisa-select-option-row__person">
            <span className="brisa-select-option-row__name">{e.nome}</span>
            <span className="brisa-select-option-row__roles">
              <span
                className={
                  chipPrincipal
                    ? 'brisa-role-chip'
                    : 'brisa-role-chip brisa-role-chip--extra'
                }
              >
                {chipPrincipal ?? 'Extra'}
              </span>
              {secundarias.map((fn) => (
                <span
                  key={fn}
                  className="brisa-role-chip brisa-role-chip--secondary"
                >
                  {labelFuncao(fn)}
                </span>
              ))}
            </span>
          </span>
          {pills.length > 0 && (
            <span className="brisa-select-option-row__pills">{pills}</span>
          )}
        </span>
      ),
      disabled: !pode,
    };
  }

  /** Carrega do `turno` ou zera para “novo”. Só depende de `turno` — incluir `extras`/`funcionarios` reaplicava estado inicial e apagava o rascunho ao cadastrar extra na vaga. */
  useEffect(() => {
    if (turno) {
      const nec = necessidadesParaRegistro(turno.necessidades);
      let sugestoesSlots: Record<Funcao, string[]>;
      if (turno.sugestoesPorFuncao != null) {
        sugestoesSlots = sanitizarSlots(
          slotsParaQuantidades(nec, turno.sugestoesPorFuncao),
          nec,
          funcionarios,
          extras,
          turno.localTrabalho,
        );
      } else {
        sugestoesSlots = migrarSugestoesLegadas(
          turno.funcionariosSugeridos,
          nec,
          funcionarios,
          turno.localTrabalho,
        );
      }
      setForm({
        nome: turno.nome,
        tipo: turno.tipo,
        categoria: turno.categoria,
        localTrabalho: turno.localTrabalho,
        horaInicio: turno.horaInicio,
        horaFim: turno.horaFim,
        necessidades: nec,
        sugestoesSlots,
        diaSemanaRecorrente:
          turno.tipo === 'regular' &&
          isRecorrenciaEscala(turno.diaSemanaRecorrente)
            ? String(turno.diaSemanaRecorrente)
            : '',
        observacoes: turno.observacoes ?? '',
        ativo: turno.ativo,
      });
    } else {
      setForm(ESTADO_INICIAL);
    }
    setErros({});
  }, [turno]);

  useEffect(() => {
    if (!turno) return;
    if (turno.sugestoesPorFuncao != null) {
      setForm((prev) => ({
        ...prev,
        sugestoesSlots: sanitizarSlots(
          prev.sugestoesSlots,
          prev.necessidades,
          funcionarios,
          extras,
          prev.localTrabalho as LocalTrabalho,
        ),
      }));
      return;
    }
    setForm((prev) => {
      const nec = prev.necessidades;
      const local = prev.localTrabalho as LocalTrabalho;
      const slotado = Object.values(prev.sugestoesSlots).some((r) =>
        r.some(Boolean),
      );
      if (!slotado && funcionarios.length > 0) {
        return {
          ...prev,
          sugestoesSlots: migrarSugestoesLegadas(
            turno.funcionariosSugeridos,
            nec,
            funcionarios,
            local,
          ),
        };
      }
      return {
        ...prev,
        sugestoesSlots: sanitizarSlots(
          prev.sugestoesSlots,
          nec,
          funcionarios,
          extras,
          local,
        ),
      };
    });
  }, [funcionarios, turno, extras]);

  const duracao = useMemo(
    () => calcularDuracao(form.horaInicio, form.horaFim),
    [form.horaInicio, form.horaFim],
  );

  function atualizarCampo<K extends keyof FormState>(
    campo: K,
    valor: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: undefined }));
  }

  function aplicarPresetCategoria(categoria: CategoriaTurno) {
    const preset = CATEGORIAS_TURNO.find((c) => c.value === categoria);
    setForm((prev) => ({
      ...prev,
      categoria,
      horaInicio: preset?.horaInicio ?? '',
      horaFim: preset?.horaFim ?? '',
    }));
    setErros((prev) => ({
      ...prev,
      categoria: undefined,
      horario: undefined,
    }));
  }

  function ajustarNecessidade(funcao: Funcao, delta: number) {
    setForm((prev) => {
      const novoValor = Math.max(0, (prev.necessidades[funcao] ?? 0) + delta);
      const novasNec = { ...prev.necessidades, [funcao]: novoValor };
      return {
        ...prev,
        necessidades: novasNec,
        sugestoesSlots: slotsParaQuantidades(novasNec, prev.sugestoesSlots),
      };
    });
    setErros((prev) => ({ ...prev, necessidades: undefined }));
  }

  async function confirmarExtraModal() {
    if (!extraModal) return;
    const nome = extraNome.trim();
    if (!nome) return;
    const novo = await extrasStorage.criarSóNome(nome);
    onExtrasChange?.();
    atualizarSlot(extraModal.funcao, extraModal.indice, novo.id);
    setExtraModal(null);
    setExtraNome('');
  }

  function atualizarSlot(funcao: Funcao, indice: number, funcionarioId: string) {
    setForm((prev) => {
      const row = [...(prev.sugestoesSlots[funcao] ?? [])];
      if (indice >= 0 && indice < row.length) {
        row[indice] = funcionarioId;
      }
      return {
        ...prev,
        sugestoesSlots: { ...prev.sugestoesSlots, [funcao]: row },
      };
    });
  }

  function idsEmOutrasVagas(
    slots: Record<Funcao, string[]>,
    funcaoAtual: Funcao,
    indiceAtual: number,
  ): Set<string> {
    const used = new Set<string>();
    for (const { value: f } of FUNCOES) {
      const row = slots[f] ?? [];
      row.forEach((id, i) => {
        if (!id) return;
        if (f === funcaoAtual && i === indiceAtual) return;
        used.add(id);
      });
    }
    return used;
  }

  function validar(): boolean {
    const novosErros: FormErrors = {};
    if (!form.nome.trim()) novosErros.nome = 'Informe um nome para o turno.';
    if (!form.tipo) novosErros.tipo = 'Selecione o tipo.';
    if (!form.categoria) novosErros.categoria = 'Selecione a categoria.';
    if (!form.localTrabalho)
      novosErros.localTrabalho = 'Selecione o local de trabalho.';
    if (!form.horaInicio || !form.horaFim) {
      novosErros.horario = 'Defina o horário de início e fim.';
    } else if (form.horaInicio === form.horaFim) {
      novosErros.horario = 'Início e fim não podem ser iguais.';
    }
    const totalNecessidades = Object.values(form.necessidades).reduce(
      (acc, n) => acc + n,
      0,
    );
    if (totalNecessidades === 0) {
      novosErros.necessidades =
        'Defina pelo menos 1 pessoa em alguma função.';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validar()) return;

    const sugestoesPorFuncao: NonNullable<TurnoInput['sugestoesPorFuncao']> =
      {};
    for (const n of necessidadesParaArray(form.necessidades)) {
      const row = (form.sugestoesSlots[n.funcao] ?? []).slice(0, n.quantidade);
      while (row.length < n.quantidade) row.push('');
      sugestoesPorFuncao[n.funcao] = row.map((id) => {
        if (!id) return '';
        if (extras.some((e) => e.id === id)) return id;
        return funcionariosCompativeis.some((f) => f.id === id) ? id : '';
      });
    }

    const funcionariosSugeridos = ordenarIdsDasVagas(form.sugestoesSlots).filter(
      (id) =>
        funcionariosCompativeis.some((f) => f.id === id) ||
        extras.some((e) => e.id === id),
    );

    const diaRec =
      form.tipo === 'regular'
        ? parseRecorrenciaEscala(form.diaSemanaRecorrente)
        : undefined;

    onSubmit({
      nome: form.nome.trim(),
      tipo: form.tipo as TipoTurno,
      categoria: form.categoria as CategoriaTurno,
      localTrabalho: form.localTrabalho as LocalTrabalho,
      horaInicio: form.horaInicio,
      horaFim: form.horaFim,
      diaSemanaRecorrente: diaRec,
      necessidades: necessidadesParaArray(form.necessidades),
      funcionariosSugeridos,
      sugestoesPorFuncao,
      observacoes: form.observacoes.trim() || undefined,
      ativo: form.ativo,
    });
  }

  const funcoesComVagas = FUNCOES.filter(
    (o) => (form.necessidades[o.value] ?? 0) > 0,
  );

  return (
    <form className="brisa-form" onSubmit={handleSubmit}>
      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <Icon name="clock" size={18} />
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Identificação do turno</h3>
            <p className="brisa-form__card-hint">
              Defina nome, tipo, categoria e onde esse turno acontece.
            </p>
          </div>
        </header>

        <Field
          label="Nome do turno"
          htmlFor="nome"
          required
          error={erros.nome}
          hint='Ex: "Manhã — Posto 6", "Plantão de feriado", "Reveillon"'
        >
          <Input
            id="nome"
            placeholder="Digite um nome para identificar o turno"
            value={form.nome}
            invalid={Boolean(erros.nome)}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            autoFocus
          />
        </Field>

        <div className="brisa-form__grid">
          <Field
            label="Tipo"
            htmlFor="tipo"
            required
            error={erros.tipo}
          >
            <Select
              id="tipo"
              placeholder="Selecione o tipo"
              options={TIPOS_TURNO}
              value={form.tipo}
              invalid={Boolean(erros.tipo)}
              onChange={(e) => {
                const v = e.target.value as TipoTurno;
                setForm((prev) => ({
                  ...prev,
                  tipo: v,
                  diaSemanaRecorrente: v === 'regular' ? prev.diaSemanaRecorrente : '',
                }));
                setErros((prev) => ({ ...prev, tipo: undefined }));
              }}
            />
          </Field>

          <Field
            label="Categoria"
            htmlFor="categoria"
            required
            error={erros.categoria}
            hint="Ao escolher a categoria, o horário é preenchido automaticamente; você pode ajustar depois."
          >
            <Select
              id="categoria"
              placeholder="Selecione a categoria"
              options={CATEGORIAS_TURNO.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
              value={form.categoria}
              invalid={Boolean(erros.categoria)}
              onChange={(e) =>
                aplicarPresetCategoria(e.target.value as CategoriaTurno)
              }
            />
          </Field>

          <Field
            label="Local de trabalho"
            htmlFor="localTrabalho"
            required
            error={erros.localTrabalho}
          >
            <Select
              id="localTrabalho"
              placeholder="Selecione o local"
              options={LOCAIS_TRABALHO}
              value={form.localTrabalho}
              invalid={Boolean(erros.localTrabalho)}
              onChange={(e) => {
                const v = e.target.value as LocalTrabalho;
                setForm((prev) => {
                  const pool = funcionarios.filter(
                    (f) =>
                      podeAparecerComoSugeridoNoTurno(f) &&
                      f.localTrabalho === v,
                  );
                  const ok = new Set(pool.map((f) => f.id));
                  const slots = { ...prev.sugestoesSlots };
                  for (const { value: f } of FUNCOES) {
                    const row = slots[f] ?? [];
                    slots[f] = row.map((id) => {
                      if (!id) return '';
                      if (extras.some((e) => e.id === id)) return id;
                      return ok.has(id) ? id : '';
                    });
                  }
                  return {
                    ...prev,
                    localTrabalho: v,
                    sugestoesSlots: slots,
                  };
                });
                setErros((prev) => ({ ...prev, localTrabalho: undefined }));
              }}
            />
          </Field>

          <Field
            label="Horário"
            required
            error={erros.horario}
            hint={duracao ? `Duração: ${duracao}` : 'Início e fim do turno.'}
          >
            <TimeRange
              inicio={form.horaInicio}
              fim={form.horaFim}
              invalid={Boolean(erros.horario)}
              onInicioChange={(v) => atualizarCampo('horaInicio', v)}
              onFimChange={(v) => atualizarCampo('horaFim', v)}
            />
          </Field>
        </div>

        {form.tipo === 'regular' && (
          <Field
            label="Dia fixo na escala"
            htmlFor="diaSemanaRecorrente"
            hint="Ao abrir a escala (dia, semana ou mês), este turno entra sozinho em todas as datas desse dia da semana, com as sugestões de alocação já aplicadas. Turnos de feriado ou especial continuam só por adição manual."
          >
            <Select
              id="diaSemanaRecorrente"
              placeholder="Escolha se há dia fixo"
              options={OPCOES_DIA_SEMANA_RECORRENTE}
              value={form.diaSemanaRecorrente}
              onChange={(e) =>
                atualizarCampo('diaSemanaRecorrente', e.target.value)
              }
            />
          </Field>
        )}
      </section>

      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <Icon name="users" size={18} />
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Necessidade da equipe</h3>
            <p className="brisa-form__card-hint">
              Quantas pessoas de cada função são necessárias neste turno.
            </p>
          </div>
        </header>

        {erros.necessidades && (
          <div className="brisa-form__inline-error">{erros.necessidades}</div>
        )}

        <ul className="brisa-stepper-list">
          {FUNCOES.map((opcao) => (
            <li key={opcao.value} className="brisa-stepper">
              <span className="brisa-stepper__label">{opcao.label}</span>
              <div className="brisa-stepper__controls">
                <button
                  type="button"
                  className="brisa-stepper__btn"
                  aria-label={`Reduzir ${opcao.label}`}
                  onClick={() => ajustarNecessidade(opcao.value, -1)}
                  disabled={(form.necessidades[opcao.value] ?? 0) <= 0}
                >
                  −
                </button>
                <span className="brisa-stepper__value">
                  {form.necessidades[opcao.value] ?? 0}
                </span>
                <button
                  type="button"
                  className="brisa-stepper__btn"
                  aria-label={`Aumentar ${opcao.label}`}
                  onClick={() => ajustarNecessidade(opcao.value, 1)}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <Icon name="user-check" size={18} />
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Alocação sugerida por função</h3>
            <p className="brisa-form__card-hint">
              {form.localTrabalho
                ? `Para cada vaga, indique quem costuma cobrir (opcional). Mostramos todos do ${labelLocal(form.localTrabalho as LocalTrabalho)}; inativos ficam bloqueados. Etiquetas ao lado do nome: folga semanal, ausência ou inativo na data de referência do turno (próxima ocorrência do dia fixo, ou hoje). Use Extra para alguém fora do quadro (vai para a lista Extras). A mesma pessoa não pode ocupar duas vagas ao mesmo tempo.`
                : 'Selecione o local acima para listar opções e preencher as vagas.'}
            </p>
          </div>
        </header>

        {!form.localTrabalho ? (
          <div className="brisa-form__empty">
            Selecione o local de trabalho acima para ver as opções.
          </div>
        ) : funcoesComVagas.length === 0 ? (
          <div className="brisa-form__empty">
            Defina pelo menos uma vaga em &quot;Necessidade da equipe&quot; para
            alocar sugestões por função.
          </div>
        ) : (
          <div className="brisa-alocacao-turno">
            {funcionariosCompativeis.length === 0 && extras.length === 0 && (
              <p className="brisa-alocacao-turno__aviso">
                Nenhum funcionário ativo neste local. Use o botão <strong>Extra</strong>{' '}
                para cadastrar cobertura pontual; o nome passa para a lista Extras.
              </p>
            )}
            {funcoesComVagas.map(({ value: funcao, label }) => {
              const vagas = form.sugestoesSlots[funcao] ?? [];
              return (
                <div key={funcao} className="brisa-alocacao-turno__bloco">
                  <h4 className="brisa-alocacao-turno__titulo">{label}</h4>
                  <ul className="brisa-alocacao-turno__lista">
                    {vagas.map((valorAtual, indice) => {
                      const ocupados = idsEmOutrasVagas(
                        form.sugestoesSlots,
                        funcao,
                        indice,
                      );
                      const opcoesFunc = funcionariosDoLocalAlocacao.filter(
                        (f) => !ocupados.has(f.id) || f.id === valorAtual,
                      );
                      const opcoesExtras = extras.filter(
                        (e) => !ocupados.has(e.id) || e.id === valorAtual,
                      );
                      const options: SelectOption[] = [
                        { value: '', label: '— Sem sugestão —' },
                        ...opcoesFunc.map(opcaoFuncionarioAlocacao),
                        ...opcoesExtras.map(opcaoExtraAlocacao),
                      ];
                      const selectId = `sug-${funcao}-${indice}`;
                      return (
                        <li key={selectId} className="brisa-alocacao-turno__linha">
                          <label
                            className="brisa-alocacao-turno__label"
                            htmlFor={selectId}
                          >
                            Vaga {indice + 1}
                          </label>
                          <div className="brisa-alocacao-turno__campo">
                            <Select
                              id={selectId}
                              placeholder="Escolha quem cobre esta vaga"
                              options={options}
                              value={valorAtual}
                              searchable
                              searchPlaceholder="Buscar por nome…"
                              onChange={(e) =>
                                atualizarSlot(funcao, indice, e.target.value)
                              }
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              className="brisa-alocacao-turno__extra-btn"
                              onClick={() => {
                                setExtraNome('');
                                setExtraModal({ funcao, indice });
                              }}
                            >
                              Extra
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <Icon name="message" size={18} />
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Detalhes adicionais</h3>
            <p className="brisa-form__card-hint">
              Observações e disponibilidade do turno.
            </p>
          </div>
        </header>

        <Field
          label="Observações"
          htmlFor="observacoes"
          hint="Ex: regras especiais, instruções para a equipe, etc."
        >
          <Textarea
            id="observacoes"
            placeholder="Adicione observações sobre este turno…"
            value={form.observacoes}
            rows={3}
            onChange={(e) => atualizarCampo('observacoes', e.target.value)}
          />
        </Field>

        <div className="brisa-toggle-row">
          <Checkbox
            label="Turno ativo (disponível para uso na escala)"
            checked={form.ativo}
            onChange={(e) => atualizarCampo('ativo', e.target.checked)}
          />
        </div>
      </section>

      <div className="brisa-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {turno ? 'Salvar alterações' : 'Criar turno'}
        </Button>
      </div>

      <Modal
        open={Boolean(extraModal)}
        onClose={() => {
          setExtraModal(null);
          setExtraNome('');
        }}
        title="Cadastrar extra nesta vaga"
        description="Nome da pessoa que cobre pontualmente. O registro fica na lista Extras para completar dados depois, se quiser."
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setExtraModal(null);
                setExtraNome('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void confirmarExtraModal()}
              disabled={!extraNome.trim()}
            >
              Adicionar
            </Button>
          </>
        }
      >
        <Field label="Nome" htmlFor="extra-nome-turno" required>
          <Input
            id="extra-nome-turno"
            placeholder="Ex.: Maria Souza"
            value={extraNome}
            onChange={(e) => setExtraNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && extraNome.trim()) {
                e.preventDefault();
                void confirmarExtraModal();
              }
            }}
            autoFocus
          />
        </Field>
      </Modal>
    </form>
  );
}
