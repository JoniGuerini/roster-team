import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import {
  FUNCOES,
  LOCAIS_TRABALHO,
  OPCOES_DIA_FOLGA_SEMANAL,
  STATUS_FUNCIONARIO,
  TIPOS_CONTRATO,
  type DiaFolgaSemanal,
  type DocumentoPdf,
  type Funcao,
  type Funcionario,
  type FuncionarioInput,
  type LocalTrabalho,
  type PeriodoAusencia,
  type StatusFuncionario,
  type TipoContrato,
} from '../../types/funcionario';
import type { PessoaExtra, PessoaExtraInput } from '../../types/pessoaExtra';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { AusenciasEditor } from './AusenciasEditor';
import { cpfValido, formatarCpf } from '../../utils/cpf';
import './FuncionarioForm.css';

const TIPOS_DOCUMENTO_ACEITOS = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const EXTENSAO_DOCUMENTO_ACEITA = /\.(pdf|jpe?g|png|gif|webp|heic|heif)$/i;

const ACCEPT_DOCUMENTOS = 'application/pdf,image/*';

function arquivoDocumentoAceito(arquivo: File): boolean {
  if (TIPOS_DOCUMENTO_ACEITOS.has(arquivo.type)) return true;
  if (!arquivo.type) return EXTENSAO_DOCUMENTO_ACEITA.test(arquivo.name);
  return arquivo.type.startsWith('image/');
}

export type FuncionarioFormProps =
  | {
      variant?: 'employee';
      funcionario?: Funcionario;
      onCancel: () => void;
      onSubmit: (input: FuncionarioInput) => void;
    }
  | {
      variant: 'extra';
      extra?: PessoaExtra;
      onCancel: () => void;
      onSubmit: (input: PessoaExtraInput) => void;
    };

interface FormState {
  nome: string;
  cpf: string;
  localTrabalho: LocalTrabalho | '';
  tipoContrato: TipoContrato | '';
  funcaoPrincipal: Funcao | '';
  dataAdmissao: string;
  status: StatusFuncionario | '';
  /** '' = sem folga fixa; '0'–'6' = domingo–sábado */
  diaFolgaSemanal: string;
  funcoesSecundarias: Funcao[];
  descricao: string;
  documentos: DocumentoPdf[];
  ausencias: PeriodoAusencia[];
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const ESTADO_INICIAL: FormState = {
  nome: '',
  cpf: '',
  localTrabalho: '',
  tipoContrato: '',
  funcaoPrincipal: '',
  dataAdmissao: '',
  status: '',
  diaFolgaSemanal: '',
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

export function FuncionarioForm(props: FuncionarioFormProps) {
  const isExtra = props.variant === 'extra';
  const registroExtra = props.variant === 'extra' ? props.extra : undefined;
  const registroFuncionario =
    props.variant !== 'extra' ? props.funcionario : undefined;

  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erros, setErros] = useState<FormErrors>({});
  const [arrastandoDocumentos, setArrastandoDocumentos] = useState(false);

  useEffect(() => {
    if (isExtra) {
      const extra = registroExtra;
      if (extra) {
        setForm({
          nome: extra.nome,
          cpf: extra.cpf ?? '',
          localTrabalho: extra.localTrabalho ?? '',
          tipoContrato: extra.tipoContrato ?? '',
          funcaoPrincipal: extra.funcaoPrincipal ?? '',
          dataAdmissao: extra.dataAdmissao ?? '',
          status: extra.status ?? '',
          diaFolgaSemanal:
            extra.diaFolgaSemanal != null ? String(extra.diaFolgaSemanal) : '',
          funcoesSecundarias: extra.funcoesSecundarias ?? [],
          descricao: extra.descricao ?? '',
          documentos: extra.documentos ?? [],
          ausencias: extra.ausencias ?? [],
        });
      } else {
        setForm(ESTADO_INICIAL);
      }
    } else {
      const funcionario = registroFuncionario;
      if (funcionario) {
        setForm({
          nome: funcionario.nome,
          cpf: funcionario.cpf ?? '',
          localTrabalho: funcionario.localTrabalho ?? '',
          tipoContrato: funcionario.tipoContrato ?? '',
          funcaoPrincipal: funcionario.funcaoPrincipal ?? '',
          dataAdmissao: funcionario.dataAdmissao ?? '',
          status: funcionario.status ?? '',
          diaFolgaSemanal:
            funcionario.diaFolgaSemanal != null
              ? String(funcionario.diaFolgaSemanal)
              : '',
          funcoesSecundarias: funcionario.funcoesSecundarias ?? [],
          descricao: funcionario.descricao ?? '',
          documentos: funcionario.documentos ?? [],
          ausencias: funcionario.ausencias ?? [],
        });
      } else {
        setForm(ESTADO_INICIAL);
      }
    }
    setErros({});
  }, [isExtra, registroExtra, registroFuncionario]);

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

  function processarArquivosLista(arquivos: FileList | File[]) {
    const novos: DocumentoPdf[] = Array.from(arquivos)
      .filter(arquivoDocumentoAceito)
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
  }

  function adicionarArquivos(event: ChangeEvent<HTMLInputElement>) {
    const arquivos = event.target.files;
    if (!arquivos) return;
    processarArquivosLista(arquivos);
    event.target.value = '';
  }

  function handleDocumentosDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setArrastandoDocumentos(true);
  }

  function handleDocumentosDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDocumentosDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setArrastandoDocumentos(false);
    }
  }

  function handleDocumentosDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setArrastandoDocumentos(false);
    if (event.dataTransfer.files.length > 0) {
      processarArquivosLista(event.dataTransfer.files);
    }
  }

  function removerDocumento(id: string) {
    setForm((prev) => ({
      ...prev,
      documentos: prev.documentos.filter((doc) => doc.id !== id),
    }));
  }

  function validar(): boolean {
    const novosErros: FormErrors = {};
    if (!form.nome.trim()) {
      novosErros.nome = isExtra
        ? 'Informe o nome.'
        : 'Informe o nome do funcionário.';
    }
    if (form.cpf.trim() && !cpfValido(form.cpf)) {
      novosErros.cpf = 'CPF inválido.';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function montarInputComum() {
    const secundarias = form.funcoesSecundarias.filter(
      (f) => f !== form.funcaoPrincipal,
    );
    return {
      nome: form.nome.trim(),
      cpf: form.cpf.trim() || undefined,
      localTrabalho: form.localTrabalho
        ? (form.localTrabalho as LocalTrabalho)
        : undefined,
      tipoContrato: form.tipoContrato
        ? (form.tipoContrato as TipoContrato)
        : undefined,
      funcaoPrincipal: form.funcaoPrincipal
        ? (form.funcaoPrincipal as Funcao)
        : undefined,
      funcoesSecundarias: secundarias,
      dataAdmissao: form.dataAdmissao || undefined,
      status: form.status ? (form.status as StatusFuncionario) : undefined,
      diaFolgaSemanal:
        form.diaFolgaSemanal === ''
          ? null
          : (Number(form.diaFolgaSemanal) as DiaFolgaSemanal),
      descricao: form.descricao.trim() || undefined,
      documentos: form.documentos,
      ausencias: form.ausencias,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validar()) return;
    if (props.variant === 'extra') {
      props.onSubmit(montarInputComum());
      return;
    }
    props.onSubmit(montarInputComum());
  }

  return (
    <form id="funcionario-form" className="brisa-form" onSubmit={handleSubmit}>
      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <Icon name="user" size={18} />
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Dados básicos</h3>
            <p className="brisa-form__card-hint">
              {isExtra
                ? 'Identificação da pessoa extra (cobertura pontual, fora do quadro).'
                : 'Informações principais para identificar o funcionário.'}
            </p>
          </div>
        </header>

        <Field
          label={isExtra ? 'Nome completo' : 'Nome do funcionário'}
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

        <Field
          label="CPF"
          htmlFor="cpf"
          error={erros.cpf}
          hint="Opcional"
        >
          <Input
            id="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.cpf}
            maxLength={14}
            invalid={Boolean(erros.cpf)}
            onChange={(e) => atualizarCampo('cpf', formatarCpf(e.target.value))}
          />
        </Field>

        <div className="brisa-form__grid">
          <Field
            label="Local de trabalho"
            htmlFor="localTrabalho"
            required={false}
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
            required={false}
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
            required={false}
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
            required={false}
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

        <Field
          label="Dia de folga fixo na semana"
          htmlFor="diaFolgaSemanal"
          hint="Nesse dia a pessoa não aparece para ser alocada na escala. Se já estiver num turno, a escala mostra alerta até substituir ou remover."
        >
          <Select
            id="diaFolgaSemanal"
            placeholder="Opcional"
            options={OPCOES_DIA_FOLGA_SEMANAL}
            value={form.diaFolgaSemanal}
            onChange={(e) => atualizarCampo('diaFolgaSemanal', e.target.value)}
          />
        </Field>
      </section>

      <section className="brisa-form__card brisa-form__card--neutral">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <Icon name="checkbox" size={18} />
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Funções na cafeteria</h3>
            <p className="brisa-form__card-hint">
              {isExtra
                ? 'Defina a função principal e as outras que a pessoa também pode exercer.'
                : 'Defina a função principal e marque as outras que ele(a) também exerce.'}
            </p>
          </div>
        </header>

        <Field
          label="Função principal"
          htmlFor="funcaoPrincipal"
          required={false}
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
          hint={
            isExtra
              ? 'Selecione outras funções que esta pessoa pode exercer.'
              : 'Selecione outras funções que este funcionário pode exercer.'
          }
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
            placeholder={
              isExtra
                ? 'Adicione observações ou detalhes sobre o extra…'
                : 'Adicione observações ou detalhes sobre o funcionário…'
            }
            value={form.descricao}
            rows={4}
            onChange={(e) => atualizarCampo('descricao', e.target.value)}
          />
        </Field>
      </section>

      <section className="brisa-form__card">
        <header className="brisa-form__card-header">
          <span className="brisa-form__card-icon" aria-hidden="true">
            <Icon name="calendar-event" size={18} />
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Períodos de ausência</h3>
            <p className="brisa-form__card-hint">
              {isExtra
                ? 'Cadastre férias, afastamentos e licenças (úteis se esta pessoa voltar a ser escalada).'
                : 'Cadastre férias, afastamentos e licenças. Esses períodos vão marcar a pessoa como indisponível na escala.'}
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
            <Icon name="file-text" size={18} />
          </span>
          <div className="brisa-form__card-text">
            <h3 className="brisa-form__card-title">Documentos</h3>
            <p className="brisa-form__card-hint">
              Anexe contratos, exames médicos e outros documentos importantes
              (PDF ou imagem).
            </p>
          </div>
        </header>

        <label
          className={[
            'brisa-upload',
            arrastandoDocumentos ? 'brisa-upload--drag' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          htmlFor="documentos"
          onDragEnter={handleDocumentosDragEnter}
          onDragOver={handleDocumentosDragOver}
          onDragLeave={handleDocumentosDragLeave}
          onDrop={handleDocumentosDrop}
        >
          <input
            id="documentos"
            type="file"
            accept={ACCEPT_DOCUMENTOS}
            multiple
            hidden
            onChange={adicionarArquivos}
          />
          <Icon name="upload" size={22} />
          <span className="brisa-upload__title">
            {arrastandoDocumentos
              ? 'Solte os arquivos aqui'
              : 'Clique ou arraste PDF e imagens'}
          </span>
          <span className="brisa-upload__hint">
            Exames médicos, contratos, fotos de documentos, etc.
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
                  <Icon name="x" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="brisa-form__actions">
        <Button type="button" variant="secondary" onClick={props.onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {isExtra
            ? registroExtra
              ? 'Salvar alterações'
              : 'Registrar extra'
            : registroFuncionario
              ? 'Salvar alterações'
              : 'Registrar Funcionário'}
        </Button>
      </div>
    </form>
  );
}
