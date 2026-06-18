import { useRef, useState, type FormEvent } from 'react';

import { Button } from '../ui/Button';

import { Field } from '../ui/Field';

import { Input } from '../ui/Input';

import { Select } from '../ui/Select';

import { Icon } from '../ui/Icon';

import { EmpresaLogo } from './EmpresaLogo';

import {

  COR_PRIMARIA_PADRAO,

  STATUS_EMPRESA,

  type Empresa,

  type EmpresaInput,

  type StatusEmpresa,

} from '../../types/empresa';

import '../funcionarios/FuncionarioForm.css';

import './EmpresaForm.css';



interface EmpresaFormProps {

  empresa?: Empresa;

  onCancel: () => void;

  onSubmit: (input: EmpresaInput) => void;

}



const LIMITE_LOGO_BYTES = 512 * 1024;



interface FormState {

  nome: string;

  segmento: string;

  logoUrl: string | null;

  corPrimaria: string;

  ownerNome: string;

  ownerEmail: string;

  status: StatusEmpresa;

}



function estadoInicial(empresa?: Empresa): FormState {

  return {

    nome: empresa?.nome ?? '',

    segmento: empresa?.segmento ?? '',

    logoUrl: empresa?.logoUrl ?? null,

    corPrimaria: empresa?.corPrimaria ?? COR_PRIMARIA_PADRAO,

    ownerNome: empresa?.ownerNome ?? '',

    ownerEmail: empresa?.ownerEmail ?? '',

    status: empresa?.status ?? 'ativa',

  };

}



const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



export function EmpresaForm({ empresa, onCancel, onSubmit }: EmpresaFormProps) {

  const [form, setForm] = useState<FormState>(() => estadoInicial(empresa));

  const [erros, setErros] = useState<Partial<Record<keyof FormState, string>>>(

    {},

  );

  const [logoErro, setLogoErro] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);



  function atualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {

    setForm((f) => ({ ...f, [campo]: valor }));

    setErros((e) => ({ ...e, [campo]: undefined }));

  }



  function selecionarLogo(file: File) {

    setLogoErro(null);

    if (!file.type.startsWith('image/')) {

      setLogoErro('Selecione um arquivo de imagem.');

      return;

    }

    if (file.size > LIMITE_LOGO_BYTES) {

      setLogoErro('Imagem muito grande (máx. 512 KB).');

      return;

    }

    const reader = new FileReader();

    reader.onload = () => atualizar('logoUrl', reader.result as string);

    reader.readAsDataURL(file);

  }



  function validar(): boolean {

    const novos: Partial<Record<keyof FormState, string>> = {};

    if (!form.nome.trim()) novos.nome = 'Informe o nome da empresa.';

    if (!form.ownerNome.trim()) novos.ownerNome = 'Informe o responsável.';

    if (!form.ownerEmail.trim()) {

      novos.ownerEmail = 'Informe o e-mail do owner.';

    } else if (!EMAIL_REGEX.test(form.ownerEmail.trim())) {

      novos.ownerEmail = 'E-mail inválido.';

    }

    setErros(novos);

    return Object.keys(novos).length === 0;

  }



  function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    if (!validar()) return;

    onSubmit({

      nome: form.nome.trim(),

      segmento: form.segmento.trim(),

      logoUrl: form.logoUrl,

      corPrimaria: form.corPrimaria,

      ownerNome: form.ownerNome.trim(),

      ownerEmail: form.ownerEmail.trim().toLowerCase(),

      status: form.status,

    });

  }



  return (

    <form className="brisa-form" onSubmit={handleSubmit} noValidate>

      <section className="brisa-form__card">

        <header className="brisa-form__card-header">

          <span className="brisa-form__card-icon" aria-hidden="true">

            <Icon name="photo" size={18} />

          </span>

          <div className="brisa-form__card-text">

            <h3 className="brisa-form__card-title">Marca</h3>

            <p className="brisa-form__card-hint">

              Logo e cor usados no app e nos cards da empresa.

            </p>

          </div>

        </header>



        <div className="brisa-empresa-form__marca">

          <EmpresaLogo

            nome={form.nome || 'Nova empresa'}

            logoUrl={form.logoUrl}

            corPrimaria={form.corPrimaria}

            size={72}

          />

          <div className="brisa-empresa-form__marca-acoes">

            <div className="brisa-empresa-form__marca-botoes">

              <Button

                type="button"

                variant="secondary"

                size="sm"

                leftIcon={<Icon name="upload" size={15} />}

                onClick={() => fileRef.current?.click()}

              >

                {form.logoUrl ? 'Trocar' : 'Enviar logo'}

              </Button>

              {form.logoUrl ? (

                <Button

                  type="button"

                  variant="ghost"

                  size="sm"

                  leftIcon={<Icon name="trash" size={15} />}

                  onClick={() => atualizar('logoUrl', null)}

                >

                  Remover

                </Button>

              ) : null}

            </div>

            <span className="brisa-empresa-form__marca-hint">

              PNG, JPG ou SVG até 512 KB. Sem logo, usamos as iniciais com a cor

              da marca.

            </span>

            {logoErro ? (

              <span className="brisa-empresa-form__marca-erro">{logoErro}</span>

            ) : null}

          </div>

          <input

            ref={fileRef}

            type="file"

            accept="image/*"

            hidden

            onChange={(e) => {

              const file = e.target.files?.[0];

              if (file) selecionarLogo(file);

              e.target.value = '';

            }}

          />

        </div>

      </section>



      <section className="brisa-form__card">

        <header className="brisa-form__card-header">

          <span className="brisa-form__card-icon" aria-hidden="true">

            <Icon name="building" size={18} />

          </span>

          <div className="brisa-form__card-text">

            <h3 className="brisa-form__card-title">Dados da empresa</h3>

            <p className="brisa-form__card-hint">

              Identificação, owner e status no sistema.

            </p>

          </div>

        </header>



        <div className="brisa-form__grid">

          <Field

            label="Nome da empresa"

            htmlFor="empresa-nome"

            required

            error={erros.nome}

          >

            <Input

              id="empresa-nome"

              placeholder="Ex.: Café Central"

              value={form.nome}

              invalid={Boolean(erros.nome)}

              onChange={(e) => atualizar('nome', e.target.value)}

            />

          </Field>



          <Field label="Segmento" htmlFor="empresa-segmento">

            <Input

              id="empresa-segmento"

              placeholder="Ex.: Cafeteria, Restaurante…"

              value={form.segmento}

              onChange={(e) => atualizar('segmento', e.target.value)}

            />

          </Field>



          <Field label="Cor da marca" htmlFor="empresa-cor">

            <div className="brisa-empresa-form__cor">

              <input

                id="empresa-cor"

                type="color"

                className="brisa-empresa-form__cor-input"

                value={form.corPrimaria}

                onChange={(e) => atualizar('corPrimaria', e.target.value)}

              />

              <span className="brisa-empresa-form__cor-valor">

                {form.corPrimaria.toUpperCase()}

              </span>

            </div>

          </Field>



          <Field label="Status" htmlFor="empresa-status">

            <Select

              id="empresa-status"

              options={STATUS_EMPRESA.map((s) => ({

                value: s.value,

                label: s.label,

              }))}

              value={form.status}

              onChange={(e) =>

                atualizar('status', e.target.value as StatusEmpresa)

              }

            />

          </Field>



          <Field

            label="Owner (responsável)"

            htmlFor="empresa-owner"

            required

            error={erros.ownerNome}

          >

            <Input

              id="empresa-owner"

              placeholder="Nome do responsável"

              value={form.ownerNome}

              invalid={Boolean(erros.ownerNome)}

              onChange={(e) => atualizar('ownerNome', e.target.value)}

            />

          </Field>



          <Field

            label="E-mail do owner"

            htmlFor="empresa-owner-email"

            required

            error={erros.ownerEmail}

          >

            <Input

              id="empresa-owner-email"

              type="email"

              placeholder="owner@empresa.com"

              value={form.ownerEmail}

              invalid={Boolean(erros.ownerEmail)}

              onChange={(e) => atualizar('ownerEmail', e.target.value)}

            />

          </Field>

        </div>

      </section>



      <div className="brisa-form__actions">

        <Button type="button" variant="secondary" onClick={onCancel}>

          Cancelar

        </Button>

        <Button type="submit" variant="primary">

          {empresa ? 'Salvar alterações' : 'Criar empresa'}

        </Button>

      </div>

    </form>

  );

}


