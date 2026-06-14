import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  GRUPOS_PERMISSOES,
  PAPEIS_USUARIO,
  PERMISSOES_POR_PAPEL,
  STATUS_USUARIO,
  type PapelUsuario,
  type Permissao,
  type StatusUsuario,
  type Usuario,
  type UsuarioInput,
} from '../../types/usuario';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { descricaoPapel } from '../../utils/usuarioLabels';
import '../funcionarios/FuncionarioForm.css';
import './UsuarioForm.css';

interface UsuarioFormProps {
  usuario?: Usuario;
  onCancel: () => void;
  onSubmit: (input: UsuarioInput) => void;
}

interface FormState {
  nome: string;
  email: string;
  papel: PapelUsuario | '';
  status: StatusUsuario | '';
  permissoes: Permissao[];
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const ESTADO_INICIAL: FormState = {
  nome: '',
  email: '',
  papel: '',
  status: 'ativo',
  permissoes: [],
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UsuarioForm({ usuario, onCancel, onSubmit }: UsuarioFormProps) {
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erros, setErros] = useState<FormErrors>({});

  useEffect(() => {
    if (usuario) {
      setForm({
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        status: usuario.status,
        permissoes: [...usuario.permissoes],
      });
    } else {
      setForm(ESTADO_INICIAL);
    }
    setErros({});
  }, [usuario]);

  const ehAdmin = form.papel === 'administrador';

  const permissoesSelecionadas = useMemo(
    () => new Set(form.permissoes),
    [form.permissoes],
  );

  function aplicarPapel(papel: PapelUsuario) {
    setForm((prev) => ({
      ...prev,
      papel,
      permissoes: [...PERMISSOES_POR_PAPEL[papel]],
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
    if (!form.papel) novos.papel = 'Selecione um papel.';
    if (!form.status) novos.status = 'Selecione um status.';
    if (form.permissoes.length === 0) {
      novos.permissoes = 'Selecione ao menos uma permissão.';
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    onSubmit({
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      papel: form.papel as PapelUsuario,
      status: form.status as StatusUsuario,
      permissoes: form.permissoes,
    });
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
              invalid={Boolean(erros.email)}
              placeholder="pessoa@brisacafe.com"
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </Field>
          <Field
            label="Papel"
            htmlFor="usuario-papel"
            required
            error={erros.papel}
            hint={form.papel ? descricaoPapel(form.papel) : undefined}
          >
            <Select
              id="usuario-papel"
              placeholder="Selecione…"
              invalid={Boolean(erros.papel)}
              options={PAPEIS_USUARIO.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
              value={form.papel}
              onChange={(e) => aplicarPapel(e.target.value as PapelUsuario)}
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
            <span className="brisa-form__card-title">Permissões de acesso</span>
            <span className="brisa-form__card-hint">
              {ehAdmin
                ? 'Administradores têm acesso total — todas as permissões ficam ativas.'
                : 'O papel preenche um conjunto sugerido. Ajuste manualmente se precisar.'}
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
                    disabled={ehAdmin}
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
          {usuario ? 'Salvar alterações' : 'Criar usuário e gerar senha'}
        </Button>
      </div>
    </form>
  );
}
