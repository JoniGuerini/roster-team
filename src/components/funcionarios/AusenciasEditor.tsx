import { useState, type ChangeEvent } from 'react';
import {
  MOTIVOS_AUSENCIA,
  type MotivoAusencia,
  type PeriodoAusencia,
} from '../../types/funcionario';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { formatarData } from '../../utils/funcionarioLabels';
import './AusenciasEditor.css';

interface AusenciasEditorProps {
  ausencias: PeriodoAusencia[];
  onChange: (ausencias: PeriodoAusencia[]) => void;
}

interface NovoEstado {
  motivo: MotivoAusencia | '';
  inicio: string;
  fim: string;
  observacao: string;
}

const ESTADO_VAZIO: NovoEstado = {
  motivo: '',
  inicio: '',
  fim: '',
  observacao: '',
};

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function labelMotivo(motivo: MotivoAusencia): string {
  return MOTIVOS_AUSENCIA.find((m) => m.value === motivo)?.label ?? motivo;
}

export function AusenciasEditor({
  ausencias,
  onChange,
}: AusenciasEditorProps) {
  const [novo, setNovo] = useState<NovoEstado>(ESTADO_VAZIO);
  const [erro, setErro] = useState<string | null>(null);

  function atualizar<K extends keyof NovoEstado>(
    campo: K,
    valor: NovoEstado[K],
  ) {
    setNovo((prev) => ({ ...prev, [campo]: valor }));
    setErro(null);
  }

  function adicionar() {
    if (!novo.motivo) return setErro('Selecione um motivo.');
    if (!novo.inicio) return setErro('Informe a data de início.');
    if (!novo.fim) return setErro('Informe a data de fim.');
    if (novo.fim < novo.inicio)
      return setErro('A data de fim não pode ser antes da data de início.');

    const novaAusencia: PeriodoAusencia = {
      id: gerarId(),
      motivo: novo.motivo,
      inicio: novo.inicio,
      fim: novo.fim,
      observacao: novo.observacao.trim() || undefined,
    };

    onChange([...ausencias, novaAusencia]);
    setNovo(ESTADO_VAZIO);
    setErro(null);
  }

  function remover(id: string) {
    onChange(ausencias.filter((a) => a.id !== id));
  }

  const ausenciasOrdenadas = [...ausencias].sort((a, b) =>
    a.inicio.localeCompare(b.inicio),
  );

  return (
    <div className="brisa-ausencias">
      {ausenciasOrdenadas.length > 0 && (
        <ul className="brisa-ausencias__list">
          {ausenciasOrdenadas.map((ausencia) => (
            <li key={ausencia.id} className="brisa-ausencia">
              <div className="brisa-ausencia__main">
                <span className="brisa-ausencia__motivo">
                  {labelMotivo(ausencia.motivo)}
                </span>
                <span className="brisa-ausencia__periodo">
                  {formatarData(ausencia.inicio)} – {formatarData(ausencia.fim)}
                </span>
                {ausencia.observacao && (
                  <span className="brisa-ausencia__obs">
                    {ausencia.observacao}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="brisa-ausencia__remove"
                onClick={() => remover(ausencia.id)}
                aria-label="Remover ausência"
                title="Remover"
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="brisa-ausencias__novo">
        <span className="brisa-ausencias__novo-label">
          Adicionar período de ausência
        </span>
        <div className="brisa-ausencias__grid">
          <Field label="Motivo">
            <Select
              placeholder="Selecione"
              options={MOTIVOS_AUSENCIA}
              value={novo.motivo}
              onChange={(e) =>
                atualizar('motivo', e.target.value as MotivoAusencia)
              }
            />
          </Field>
          <Field label="Início">
            <Input
              type="date"
              value={novo.inicio}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                atualizar('inicio', e.target.value)
              }
            />
          </Field>
          <Field label="Fim">
            <Input
              type="date"
              value={novo.fim}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                atualizar('fim', e.target.value)
              }
            />
          </Field>
        </div>
        <Field label="Observação" hint="Opcional">
          <Input
            placeholder="Ex: férias programadas, atestado médico…"
            value={novo.observacao}
            onChange={(e) => atualizar('observacao', e.target.value)}
          />
        </Field>

        {erro && <div className="brisa-form__inline-error">{erro}</div>}

        <div className="brisa-ausencias__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={adicionar}
            leftIcon={<Icon name="plus" size={14} />}
          >
            Adicionar período
          </Button>
        </div>
      </div>
    </div>
  );
}
