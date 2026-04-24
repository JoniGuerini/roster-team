import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CATEGORIAS_TURNO,
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
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { TimeRange } from '../ui/TimeRange';
import { calcularDuracao } from '../../utils/turnoLabels';
import { labelFuncao, labelLocal } from '../../utils/funcionarioLabels';
import './TurnoForm.css';

interface TurnoFormProps {
  turno?: Turno;
  funcionarios: Funcionario[];
  onCancel: () => void;
  onSubmit: (input: TurnoInput) => void;
}

interface FormState {
  nome: string;
  tipo: TipoTurno | '';
  categoria: CategoriaTurno | '';
  localTrabalho: LocalTrabalho | '';
  horaInicio: string;
  horaFim: string;
  necessidades: Record<Funcao, number>;
  funcionariosSugeridos: string[];
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

const ESTADO_INICIAL: FormState = {
  nome: '',
  tipo: '',
  categoria: '',
  localTrabalho: '',
  horaInicio: '',
  horaFim: '',
  necessidades: { ...NECESSIDADES_VAZIAS },
  funcionariosSugeridos: [],
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
  onCancel,
  onSubmit,
}: TurnoFormProps) {
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erros, setErros] = useState<FormErrors>({});

  useEffect(() => {
    if (turno) {
      setForm({
        nome: turno.nome,
        tipo: turno.tipo,
        categoria: turno.categoria,
        localTrabalho: turno.localTrabalho,
        horaInicio: turno.horaInicio,
        horaFim: turno.horaFim,
        necessidades: necessidadesParaRegistro(turno.necessidades),
        funcionariosSugeridos: turno.funcionariosSugeridos,
        observacoes: turno.observacoes ?? '',
        ativo: turno.ativo,
      });
    } else {
      setForm(ESTADO_INICIAL);
    }
    setErros({});
  }, [turno]);

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
      horaInicio: prev.horaInicio || preset?.horaInicio || '',
      horaFim: prev.horaFim || preset?.horaFim || '',
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
      return {
        ...prev,
        necessidades: { ...prev.necessidades, [funcao]: novoValor },
      };
    });
    setErros((prev) => ({ ...prev, necessidades: undefined }));
  }

  function alternarSugerido(funcionarioId: string) {
    setForm((prev) => {
      const existe = prev.funcionariosSugeridos.includes(funcionarioId);
      return {
        ...prev,
        funcionariosSugeridos: existe
          ? prev.funcionariosSugeridos.filter((id) => id !== funcionarioId)
          : [...prev.funcionariosSugeridos, funcionarioId],
      };
    });
  }

  const funcionariosCompativeis = useMemo(() => {
    if (!form.localTrabalho) return funcionarios;
    return funcionarios.filter((f) => f.localTrabalho === form.localTrabalho);
  }, [funcionarios, form.localTrabalho]);

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
    onSubmit({
      nome: form.nome.trim(),
      tipo: form.tipo as TipoTurno,
      categoria: form.categoria as CategoriaTurno,
      localTrabalho: form.localTrabalho as LocalTrabalho,
      horaInicio: form.horaInicio,
      horaFim: form.horaFim,
      necessidades: necessidadesParaArray(form.necessidades),
      funcionariosSugeridos: form.funcionariosSugeridos.filter((id) =>
        funcionariosCompativeis.some((f) => f.id === id),
      ),
      observacoes: form.observacoes.trim() || undefined,
      ativo: form.ativo,
    });
  }

  return (
    <form className="brisa-form" onSubmit={handleSubmit}>
      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
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
              onChange={(e) => atualizarCampo('tipo', e.target.value as TipoTurno)}
            />
          </Field>

          <Field
            label="Categoria"
            htmlFor="categoria"
            required
            error={erros.categoria}
            hint="Define um horário sugerido (você pode ajustar)."
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
              onChange={(e) =>
                atualizarCampo('localTrabalho', e.target.value as LocalTrabalho)
              }
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
      </section>

      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Funcionários sugeridos</h3>
            <p className="brisa-form__card-hint">
              {form.localTrabalho
                ? `Pré-aloque pessoas que normalmente cobrem esse turno em ${labelLocal(form.localTrabalho as LocalTrabalho)}.`
                : 'Selecione um local de trabalho acima para ver os funcionários compatíveis.'}
            </p>
          </div>
        </header>

        {funcionariosCompativeis.length === 0 ? (
          <div className="brisa-form__empty">
            {funcionarios.length === 0
              ? 'Nenhum funcionário cadastrado ainda.'
              : 'Nenhum funcionário desse local. Cadastre alguém antes ou troque o local.'}
          </div>
        ) : (
          <ul className="brisa-suggested-list">
            {funcionariosCompativeis.map((funcionario) => {
              const ativo = form.funcionariosSugeridos.includes(funcionario.id);
              return (
                <li
                  key={funcionario.id}
                  className={`brisa-suggested ${ativo ? 'brisa-suggested--active' : ''}`}
                >
                  <Checkbox
                    label={`${funcionario.nome} • ${labelFuncao(funcionario.funcaoPrincipal)}`}
                    checked={ativo}
                    onChange={() => alternarSugerido(funcionario.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
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
    </form>
  );
}
