import { useEffect, useMemo, useState, type FormEvent } from 'react';

import {

  GRUPOS_PERMISSOES,

  STATUS_USUARIO,

  type Permissao,

  type StatusUsuario,

  type Usuario,

  type UsuarioInput,

} from '../../types/usuario';

import type { PerfilAcesso } from '../../types/perfilAcesso';

import { Field } from '../ui/Field';

import { Input } from '../ui/Input';

import { Select } from '../ui/Select';

import { Checkbox } from '../ui/Checkbox';

import { Button } from '../ui/Button';

import { gerarSenha } from '../../utils/gerarSenha';

import '../funcionarios/FuncionarioForm.css';

import './UsuarioForm.css';



interface UsuarioFormProps {

  usuario?: Usuario;

  perfisAcesso: PerfilAcesso[];

  /** E-mail não pode ser alterado após criação no Auth. */

  emailSomenteLeitura?: boolean;

  onCancel: () => void;

  onSubmit: (input: UsuarioInput, senha?: string) => void;

}



interface FormState {

  nome: string;

  email: string;

  senha: string;

  perfilAcessoId: string;

  status: StatusUsuario | '';

  permissoes: Permissao[];

}



type FormErrors = Partial<Record<keyof FormState, string>>;



const ESTADO_INICIAL: FormState = {

  nome: '',

  email: '',

  senha: '',

  perfilAcessoId: '',

  status: 'ativo',

  permissoes: [],

};



const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



export function UsuarioForm({

  usuario,

  perfisAcesso,

  emailSomenteLeitura = false,

  onCancel,

  onSubmit,

}: UsuarioFormProps) {

  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);

  const [erros, setErros] = useState<FormErrors>({});



  const perfisPorId = useMemo(

    () => new Map(perfisAcesso.map((p) => [p.id, p])),

    [perfisAcesso],

  );



  useEffect(() => {

    if (usuario) {

      setForm({

        nome: usuario.nome,

        email: usuario.email,

        senha: '',

        perfilAcessoId: usuario.perfilAcessoId ?? '',

        status: usuario.status,

        permissoes: [...usuario.permissoes],

      });

    } else {

      const primeiro = perfisAcesso[0];

      setForm({

        ...ESTADO_INICIAL,

        senha: gerarSenha(),

        perfilAcessoId: primeiro?.id ?? '',

        permissoes: primeiro ? [...primeiro.permissoes] : [],

      });

    }

    setErros({});

  }, [usuario, perfisAcesso]);



  const permissoesSelecionadas = useMemo(

    () => new Set(form.permissoes),

    [form.permissoes],

  );



  const perfilSelecionado = form.perfilAcessoId

    ? perfisPorId.get(form.perfilAcessoId)

    : undefined;



  function aplicarPerfil(perfilId: string) {

    const perfil = perfisPorId.get(perfilId);

    setForm((prev) => ({

      ...prev,

      perfilAcessoId: perfilId,

      permissoes: perfil ? [...perfil.permissoes] : prev.permissoes,

    }));

  }



  function alternarPermissao(permissao: Permissao, marcada: boolean) {

    setForm((prev) => {

      const atual = new Set(prev.permissoes);

      if (marcada) atual.add(permissao);

      else atual.delete(permissao);

      return { ...prev, permissoes: [...atual] };

    });

  }



  function validar(): boolean {

    const novos: FormErrors = {};

    if (!form.nome.trim()) novos.nome = 'Informe o nome.';

    if (!form.email.trim()) {

      novos.email = 'Informe o e-mail.';

    } else if (!EMAIL_REGEX.test(form.email.trim())) {

      novos.email = 'E-mail inválido.';

    }

    if (!form.perfilAcessoId) {

      novos.perfilAcessoId = 'Selecione um perfil de permissões.';

    }

    if (!form.status) novos.status = 'Selecione um status.';

    if (!usuario) {

      if (!form.senha.trim()) {

        novos.senha = 'Informe uma senha.';

      } else if (form.senha.length < 8) {

        novos.senha = 'A senha deve ter pelo menos 8 caracteres.';

      }

    }

    if (form.permissoes.length === 0) {

      novos.permissoes = 'Selecione ao menos uma permissão.';

    }

    setErros(novos);

    return Object.keys(novos).length === 0;

  }



  function handleSubmit(e: FormEvent) {

    e.preventDefault();

    if (!validar()) return;

    onSubmit(

      {

        nome: form.nome.trim(),

        email: form.email.trim().toLowerCase(),

        perfilAcessoId: form.perfilAcessoId,

        status: form.status as StatusUsuario,

        permissoes: form.permissoes,

      },

      usuario ? undefined : form.senha,

    );

  }



  if (perfisAcesso.length === 0) {

    return (

      <div className="brisa-usuario-form__sem-perfis">

        <p>

          Nenhum perfil de acesso disponível. Crie perfis em Configurações antes

          de cadastrar usuários.

        </p>

        <div className="brisa-form__actions">

          <Button type="button" variant="secondary" onClick={onCancel}>

            Fechar

          </Button>

        </div>

      </div>

    );

  }



  return (

    <form className="brisa-form" onSubmit={handleSubmit} noValidate>

      <div className="brisa-form__card">

        <div className="brisa-form__grid">

          <Field label="Nome" htmlFor="usuario-nome" required error={erros.nome}>

            <Input

              id="usuario-nome"

              value={form.nome}

              invalid={Boolean(erros.nome)}

              placeholder="Ex.: Maria Souza"

              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}

            />

          </Field>

          <Field

            label="E-mail de acesso"

            htmlFor="usuario-email"

            required

            error={erros.email}

          >

            <Input

              id="usuario-email"

              type="email"

              value={form.email}

              readOnly={emailSomenteLeitura || Boolean(usuario)}

              invalid={Boolean(erros.email)}

              placeholder="pessoa@empresa.com"

              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}

            />

          </Field>

          {!usuario ? (

            <Field

              label="Senha provisória"

              htmlFor="usuario-senha"

              required

              error={erros.senha}

              hint="Senha temporária para o primeiro acesso. A pessoa poderá alterá-la depois no app."

            >

              <div className="brisa-usuario-form__senha">

                <Input

                  id="usuario-senha"

                  type="text"

                  value={form.senha}

                  invalid={Boolean(erros.senha)}

                  autoComplete="new-password"

                  onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}

                />

                <Button

                  type="button"

                  variant="secondary"

                  size="sm"

                  onClick={() => setForm((p) => ({ ...p, senha: gerarSenha() }))}

                >

                  Gerar

                </Button>

              </div>

            </Field>

          ) : null}

          <Field

            label="Permissões"

            htmlFor="usuario-permissoes"

            required

            error={erros.perfilAcessoId}

            hint={

              perfilSelecionado?.descricao ||

              'Escolha o perfil de acesso deste usuário.'

            }

          >

            <Select

              id="usuario-permissoes"

              placeholder="Selecione…"

              invalid={Boolean(erros.perfilAcessoId)}

              options={perfisAcesso.map((p) => ({

                value: p.id,

                label: p.nome,

              }))}

              value={form.perfilAcessoId}

              onChange={(e) => aplicarPerfil(e.target.value)}

            />

          </Field>

          <Field

            label="Status"

            htmlFor="usuario-status"

            required

            error={erros.status}

          >

            <Select

              id="usuario-status"

              placeholder="Selecione…"

              invalid={Boolean(erros.status)}

              options={STATUS_USUARIO.map((s) => ({

                value: s.value,

                label: s.label,

              }))}

              value={form.status}

              onChange={(e) =>

                setForm((p) => ({ ...p, status: e.target.value as StatusUsuario }))

              }

            />

          </Field>

        </div>

      </div>



      <div className="brisa-form__card">

        <div className="brisa-form__card-header">

          <div className="brisa-form__card-text">

            <span className="brisa-form__card-title">Ajuste fino</span>

            <span className="brisa-form__card-hint">

              O perfil preenche um conjunto sugerido. Ajuste manualmente se

              precisar de exceções para este usuário.

            </span>

          </div>

        </div>



        {erros.permissoes && (

          <p className="brisa-form__inline-error">{erros.permissoes}</p>

        )}



        <div className="brisa-perm-grupos">

          {GRUPOS_PERMISSOES.map((grupo) => (

            <fieldset className="brisa-perm-grupo" key={grupo.modulo}>

              <legend className="brisa-perm-grupo__titulo">{grupo.label}</legend>

              <div className="brisa-perm-grupo__itens">

                {grupo.permissoes.map((permissao) => (

                  <Checkbox

                    key={permissao.value}

                    label={permissao.label}

                    checked={permissoesSelecionadas.has(permissao.value)}

                    onChange={(e) =>

                      alternarPermissao(permissao.value, e.target.checked)

                    }

                  />

                ))}

              </div>

            </fieldset>

          ))}

        </div>

      </div>



      <div className="brisa-form__actions">

        <Button type="button" variant="secondary" onClick={onCancel}>

          Cancelar

        </Button>

        <Button type="submit" variant="primary">

          {usuario ? 'Salvar alterações' : 'Criar usuário'}

        </Button>

      </div>

    </form>

  );

}


