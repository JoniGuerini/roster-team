import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  FUNCOES,
  LOCAIS_TRABALHO,
  STATUS_FUNCIONARIO,
  TIPOS_CONTRATO,
  type DocumentoPdf,
  type Funcao,
  type Funcionario,
  type FuncionarioInput,
  type LocalTrabalho,
  type PeriodoAusencia,
  type StatusFuncionario,
  type TipoContrato,
} from '../../types/funcionario';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { AusenciasEditor } from './AusenciasEditor';
import './FuncionarioForm.css';

interface FuncionarioFormProps {
  funcionario?: Funcionario;
  onCancel: () => void;
  onSubmit: (input: FuncionarioInput) => void;
}

interface FormState {
  nome: string;
  localTrabalho: LocalTrabalho | '';
  tipoContrato: TipoContrato | '';
  funcaoPrincipal: Funcao | '';
  dataAdmissao: string;
  status: StatusFuncionario | '';
  funcoesSecundarias: Funcao[];
  descricao: string;
  documentos: DocumentoPdf[];
  ausencias: PeriodoAusencia[];
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const ESTADO_INICIAL: FormState = {
  nome: '',
  localTrabalho: '',
  tipoContrato: '',
  funcaoPrincipal: '',
  dataAdmissao: '',
  status: '',
  funcoesSecundarias: [],
  descricao: '',
  documentos: [],
  ausencias: [],
};

function gerarIdDocumento(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FuncionarioForm({
  funcionario,
  onCancel,
  onSubmit,
}: FuncionarioFormProps) {
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erros, setErros] = useState<FormErrors>({});

  useEffect(() => {
    if (funcionario) {
      setForm({
        nome: funcionario.nome,
        localTrabalho: funcionario.localTrabalho,
        tipoContrato: funcionario.tipoContrato,
        funcaoPrincipal: funcionario.funcaoPrincipal,
        dataAdmissao: funcionario.dataAdmissao,
        status: funcionario.status,
        funcoesSecundarias: funcionario.funcoesSecundarias,
        descricao: funcionario.descricao ?? '',
        documentos: funcionario.documentos,
        ausencias: funcionario.ausencias ?? [],
      });
    } else {
      setForm(ESTADO_INICIAL);
    }
    setErros({});
  }, [funcionario]);

  function atualizarCampo<K extends keyof FormState>(
    campo: K,
    valor: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: undefined }));
  }

  function alternarFuncaoSecundaria(funcao: Funcao) {
    setForm((prev) => {
      const existe = prev.funcoesSecundarias.includes(funcao);
      return {
        ...prev,
        funcoesSecundarias: existe
          ? prev.funcoesSecundarias.filter((f) => f !== funcao)
          : [...prev.funcoesSecundarias, funcao],
      };
    });
  }

  function adicionarArquivos(event: ChangeEvent<HTMLInputElement>) {
    const arquivos = event.target.files;
    if (!arquivos) return;
    const novos: DocumentoPdf[] = Array.from(arquivos)
      .filter((arquivo) => arquivo.type === 'application/pdf')
      .map((arquivo) => ({
        id: gerarIdDocumento(),
        nome: arquivo.name,
        tamanho: arquivo.size,
        dataUpload: new Date().toISOString(),
      }));
    if (novos.length === 0) return;
    setForm((prev) => ({
      ...prev,
      documentos: [...prev.documentos, ...novos],
    }));
    event.target.value = '';
  }

  function removerDocumento(id: string) {
    setForm((prev) => ({
      ...prev,
      documentos: prev.documentos.filter((doc) => doc.id !== id),
    }));
  }

  function validar(): boolean {
    const novosErros: FormErrors = {};
    if (!form.nome.trim()) novosErros.nome = 'Informe o nome do funcionário.';
    if (!form.localTrabalho)
      novosErros.localTrabalho = 'Selecione o local de trabalho.';
    if (!form.tipoContrato)
      novosErros.tipoContrato = 'Selecione o tipo de contrato.';
    if (!form.funcaoPrincipal)
      novosErros.funcaoPrincipal = 'Selecione a função principal.';
    if (!form.dataAdmissao)
      novosErros.dataAdmissao = 'Informe a data de admissão.';
    if (!form.status) novosErros.status = 'Selecione o status.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validar()) return;
    onSubmit({
      nome: form.nome.trim(),
      localTrabalho: form.localTrabalho as LocalTrabalho,
      tipoContrato: form.tipoContrato as TipoContrato,
      funcaoPrincipal: form.funcaoPrincipal as Funcao,
      funcoesSecundarias: form.funcoesSecundarias.filter(
        (f) => f !== form.funcaoPrincipal,
      ),
      dataAdmissao: form.dataAdmissao,
      status: form.status as StatusFuncionario,
      descricao: form.descricao.trim() || undefined,
      documentos: form.documentos,
      ausencias: form.ausencias,
    });
  }

  return (
    <form id="funcionario-form" className="brisa-form" onSubmit={handleSubmit}>
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
            </svg>
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Dados básicos</h3>
            <p className="brisa-form__card-hint">
              Informações principais para identificar o funcionário.
            </p>
          </div>
        </header>

        <Field
          label="Nome do funcionário"
          htmlFor="nome"
          required
          error={erros.nome}
        >
          <Input
            id="nome"
            placeholder="Digite o nome completo"
            value={form.nome}
            invalid={Boolean(erros.nome)}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            autoFocus
          />
        </Field>

        <div className="brisa-form__grid">
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
            label="Tipo de contrato"
            htmlFor="tipoContrato"
            required
            error={erros.tipoContrato}
          >
            <Select
              id="tipoContrato"
              placeholder="Selecione o contrato"
              options={TIPOS_CONTRATO}
              value={form.tipoContrato}
              invalid={Boolean(erros.tipoContrato)}
              onChange={(e) =>
                atualizarCampo('tipoContrato', e.target.value as TipoContrato)
              }
            />
          </Field>

          <Field
            label="Data de admissão"
            htmlFor="dataAdmissao"
            required
            error={erros.dataAdmissao}
          >
            <Input
              id="dataAdmissao"
              type="date"
              value={form.dataAdmissao}
              invalid={Boolean(erros.dataAdmissao)}
              onChange={(e) => atualizarCampo('dataAdmissao', e.target.value)}
            />
          </Field>

          <Field
            label="Status"
            htmlFor="status"
            required
            error={erros.status}
          >
            <Select
              id="status"
              placeholder="Selecione o status"
              options={STATUS_FUNCIONARIO}
              value={form.status}
              invalid={Boolean(erros.status)}
              onChange={(e) =>
                atualizarCampo('status', e.target.value as StatusFuncionario)
              }
            />
          </Field>
        </div>
      </section>

      <section className="brisa-form__card brisa-form__card--neutral">
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
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Funções na cafeteria</h3>
            <p className="brisa-form__card-hint">
              Defina a função principal e marque as outras que ele(a) também exerce.
            </p>
          </div>
        </header>

        <Field
          label="Função principal"
          htmlFor="funcaoPrincipal"
          required
          error={erros.funcaoPrincipal}
        >
          <Select
            id="funcaoPrincipal"
            placeholder="Selecione a função"
            options={FUNCOES}
            value={form.funcaoPrincipal}
            invalid={Boolean(erros.funcaoPrincipal)}
            onChange={(e) =>
              atualizarCampo('funcaoPrincipal', e.target.value as Funcao)
            }
          />
        </Field>

        <Field
          label="Funções secundárias"
          hint="Selecione outras funções que este funcionário pode exercer."
        >
          <div className="brisa-form__checkbox-grid">
            {FUNCOES.map((opcao) => (
              <Checkbox
                key={opcao.value}
                label={opcao.label}
                checked={form.funcoesSecundarias.includes(opcao.value)}
                disabled={form.funcaoPrincipal === opcao.value}
                onChange={() => alternarFuncaoSecundaria(opcao.value)}
              />
            ))}
          </div>
        </Field>

        <Field
          label="Descrição"
          htmlFor="descricao"
          hint="Opcional — observações, restrições, preferências de horário…"
        >
          <Textarea
            id="descricao"
            placeholder="Adicione observações ou detalhes sobre o funcionário…"
            value={form.descricao}
            rows={4}
            onChange={(e) => atualizarCampo('descricao', e.target.value)}
          />
        </Field>
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Períodos de ausência</h3>
            <p className="brisa-form__card-hint">
              Cadastre férias, afastamentos e licenças. Esses períodos vão
              marcar a pessoa como indisponível na escala.
            </p>
          </div>
        </header>

        <AusenciasEditor
          ausencias={form.ausencias}
          onChange={(ausencias) => atualizarCampo('ausencias', ausencias)}
        />
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Documentos (PDF)</h3>
            <p className="brisa-form__card-hint">
              Anexe contratos, exames médicos e outros documentos importantes.
            </p>
          </div>
        </header>

        <label className="brisa-upload" htmlFor="documentos">
          <input
            id="documentos"
            type="file"
            accept="application/pdf"
            multiple
            hidden
            onChange={adicionarArquivos}
          />
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="brisa-upload__title">
            Clique para subir arquivos PDF
          </span>
          <span className="brisa-upload__hint">
            Exames médicos, contratos, etc.
          </span>
        </label>

        {form.documentos.length > 0 && (
          <ul className="brisa-form__doc-list">
            {form.documentos.map((doc) => (
              <li key={doc.id} className="brisa-form__doc">
                <div className="brisa-form__doc-info">
                  <span className="brisa-form__doc-name">{doc.nome}</span>
                  <span className="brisa-form__doc-size">
                    {formatarTamanho(doc.tamanho)}
                  </span>
                </div>
                <button
                  type="button"
                  className="brisa-form__doc-remove"
                  onClick={() => removerDocumento(doc.id)}
                  aria-label={`Remover ${doc.nome}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="brisa-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {funcionario ? 'Salvar alterações' : 'Registrar Funcionário'}
        </Button>
      </div>
    </form>
  );
}
