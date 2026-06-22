import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import type { Sessao } from '../../services/authSession';
import { authSession } from '../../services/authSession';
import type { Empresa } from '../../types/empresa';
import { iniciaisDoNome } from '../../utils/funcionarioLabels';
import './AccountDialog.css';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessao: Sessao;
  empresa?: Empresa;
}

export function AccountDialog({
  open,
  onOpenChange,
  sessao,
  empresa,
}: AccountDialogProps) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarAtual, setMostrarAtual] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const papelLabel = authSession.rotuloPermissoes(sessao) ?? 'Usuário';

  useEffect(() => {
    if (!open) return;
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setMostrarAtual(false);
    setMostrarNova(false);
    setEnviando(false);
    setErro(null);
    setSucesso(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  async function handleAlterarSenha(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (!senhaAtual.trim()) {
      setErro('Informe sua senha atual.');
      return;
    }
    if (novaSenha.length < 8) {
      setErro('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação não coincide com a nova senha.');
      return;
    }

    setEnviando(true);
    const resultado = await authSession.alterarSenha(senhaAtual, novaSenha);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setSucesso(true);
  }

  if (!open) return null;

  return createPortal(
    <div
      className="brisa-account-dialog__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brisa-account-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="brisa-account-dialog">
        <aside className="brisa-account-dialog__sidebar">
          <header className="brisa-account-dialog__sidebar-head">
            <h2 id="brisa-account-dialog-title" className="brisa-account-dialog__title">
              Conta
            </h2>
            <p className="brisa-account-dialog__subtitle">
              Gerencie sua conta e segurança de acesso.
            </p>
          </header>

          <nav className="brisa-account-dialog__nav" aria-label="Seções da conta">
            <button
              type="button"
              className="brisa-account-dialog__nav-item brisa-account-dialog__nav-item--active"
              aria-current="page"
            >
              <Icon name="shield-lock" size={16} />
              Segurança
            </button>
          </nav>

          <div className="brisa-account-dialog__user">
            <div className="brisa-account-dialog__avatar" aria-hidden="true">
              {iniciaisDoNome(sessao.nome)}
            </div>
            <div className="brisa-account-dialog__user-info">
              <span className="brisa-account-dialog__user-name">{sessao.nome}</span>
              <span className="brisa-account-dialog__user-email">{sessao.email}</span>
              <div className="brisa-account-dialog__user-tags">
                <Badge tone="info">{papelLabel}</Badge>
                {!sessao.isPlatformAdmin && empresa ? (
                  <Badge tone="neutral">{empresa.nome}</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <div className="brisa-account-dialog__main">
          <button
            type="button"
            className="brisa-account-dialog__close"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
          >
            <Icon name="x" size={18} />
          </button>

          <div className="brisa-account-dialog__scroll">
            <header className="brisa-account-dialog__section-head">
              <h3 className="brisa-account-dialog__section-title">Segurança</h3>
              <p className="brisa-account-dialog__section-desc">
                Mantenha sua conta protegida.
              </p>
            </header>

            <section className="brisa-account-dialog__panel">
              <div className="brisa-account-dialog__panel-intro">
                <h4 className="brisa-account-dialog__panel-title">Alterar senha</h4>
                <p className="brisa-account-dialog__panel-desc">
                  Use uma senha forte e exclusiva, diferente das que você usa em
                  outros sites.
                </p>
              </div>

              <form
                className="brisa-account-dialog__form"
                onSubmit={handleAlterarSenha}
                noValidate
              >
                {erro ? (
                  <div
                    className="brisa-account-dialog__alert brisa-account-dialog__alert--erro"
                    role="alert"
                  >
                    <Icon name="alert-circle" size={16} />
                    <span>{erro}</span>
                  </div>
                ) : null}

                {sucesso ? (
                  <div
                    className="brisa-account-dialog__alert brisa-account-dialog__alert--ok"
                    role="status"
                  >
                    <Icon name="check" size={16} />
                    <span>Senha alterada com sucesso.</span>
                  </div>
                ) : null}

                <Field label="Senha atual" htmlFor="conta-senha-atual" required>
                  <div className="brisa-account-dialog__password">
                    <Input
                      id="conta-senha-atual"
                      type={mostrarAtual ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={senhaAtual}
                      disabled={enviando}
                      placeholder="••••••••"
                      onChange={(e) => {
                        setSenhaAtual(e.target.value);
                        setErro(null);
                        setSucesso(false);
                      }}
                    />
                    <button
                      type="button"
                      className="brisa-account-dialog__password-toggle"
                      onClick={() => setMostrarAtual((v) => !v)}
                      aria-label={
                        mostrarAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'
                      }
                    >
                      <Icon name={mostrarAtual ? 'eye-off' : 'eye'} size={16} />
                    </button>
                  </div>
                </Field>

                <div className="brisa-account-dialog__password-grid">
                  <Field label="Nova senha" htmlFor="conta-nova-senha" required>
                    <div className="brisa-account-dialog__password">
                      <Input
                        id="conta-nova-senha"
                        type={mostrarNova ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={novaSenha}
                        disabled={enviando}
                        placeholder="••••••••"
                        onChange={(e) => {
                          setNovaSenha(e.target.value);
                          setErro(null);
                          setSucesso(false);
                        }}
                      />
                      <button
                        type="button"
                        className="brisa-account-dialog__password-toggle"
                        onClick={() => setMostrarNova((v) => !v)}
                        aria-label={
                          mostrarNova ? 'Ocultar nova senha' : 'Mostrar nova senha'
                        }
                      >
                        <Icon name={mostrarNova ? 'eye-off' : 'eye'} size={16} />
                      </button>
                    </div>
                  </Field>

                  <Field
                    label="Confirmar nova senha"
                    htmlFor="conta-confirmar-senha"
                    required
                  >
                    <div className="brisa-account-dialog__password">
                      <Input
                        id="conta-confirmar-senha"
                        type={mostrarNova ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmarSenha}
                        disabled={enviando}
                        placeholder="••••••••"
                        onChange={(e) => {
                          setConfirmarSenha(e.target.value);
                          setErro(null);
                          setSucesso(false);
                        }}
                      />
                      <button
                        type="button"
                        className="brisa-account-dialog__password-toggle"
                        onClick={() => setMostrarNova((v) => !v)}
                        aria-label={
                          mostrarNova
                            ? 'Ocultar confirmação de senha'
                            : 'Mostrar confirmação de senha'
                        }
                      >
                        <Icon name={mostrarNova ? 'eye-off' : 'eye'} size={16} />
                      </button>
                    </div>
                  </Field>
                </div>

                <div className="brisa-account-dialog__form-footer">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={enviando}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={enviando}>
                    {enviando ? 'Salvando…' : 'Atualizar senha'}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
