import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  GRUPOS_PERMISSOES,
  type Permissao,
} from '../../types/usuario';
import type { PerfilAcesso, PerfilAcessoInput } from '../../types/perfilAcesso';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import '../funcionarios/FuncionarioForm.css';
import '../usuarios/UsuarioForm.css';

interface PerfilAcessoFormProps {
  perfil?: PerfilAcesso;
  onCancel: () => void;
  onSubmit: (input: PerfilAcessoInput) => void;
}

interface FormState {
  nome: string;
  descricao: string;
  permissoes: Permissao[];
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const ESTADO_INICIAL: FormState = {
  nome: '',
  descricao: '',
  permissoes: [],
};

export function PerfilAcessoForm({
  perfil,
  onCancel,
  onSubmit,
}: PerfilAcessoFormProps) {
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erros, setErros] = useState<FormErrors>({});

  useEffect(() => {
    if (perfil) {
      setForm({
        nome: perfil.nome,
        descricao: perfil.descricao,
        permissoes: [...perfil.permissoes],
      });
    } else {
      setForm(ESTADO_INICIAL);
    }
    setErros({});
  }, [perfil]);

  const permissoesSelecionadas = useMemo(
    () => new Set(form.permissoes),
    [form.permissoes],
  );

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
    if (!form.nome.trim()) novos.nome = 'Informe o nome do perfil.';
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
      descricao: form.descricao.trim(),
      permissoes: form.permissoes,
    });
  }

  return (
    <form className="brisa-form" onSubmit={handleSubmit} noValidate>
      <div className="brisa-form__card">
        <div className="brisa-form__grid">
          <Field
            label="Nome do perfil"
            htmlFor="perfil-acesso-nome"
            required
            error={erros.nome}
          >
            <Input
              id="perfil-acesso-nome"
              value={form.nome}
              invalid={Boolean(erros.nome)}
              placeholder="Ex.: Operador de caixa"
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            />
          </Field>
          <Field label="Descrição" htmlFor="perfil-acesso-descricao">
            <Textarea
              id="perfil-acesso-descricao"
              value={form.descricao}
              rows={2}
              placeholder="Resumo do que este perfil pode fazer no sistema."
              onChange={(e) =>
                setForm((p) => ({ ...p, descricao: e.target.value }))
              }
            />
          </Field>
        </div>
      </div>

      <div className="brisa-form__card">
        <div className="brisa-form__card-header">
          <div className="brisa-form__card-text">
            <span className="brisa-form__card-title">Permissões do perfil</span>
            <span className="brisa-form__card-hint">
              Marque o que usuários com este perfil poderão fazer.
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
          {perfil ? 'Salvar alterações' : 'Criar perfil'}
        </Button>
      </div>
    </form>
  );
}
