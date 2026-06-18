import { useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { Icon } from '../components/ui/Icon';
import { authSession, type Sessao } from '../services/authSession';
import './LoginPage.css';

interface LoginPageProps {
  onEntrar: (sessao: Sessao) => void;
}

export function LoginPage({ onEntrar }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    const resultado = await authSession.autenticar(email, senha);
    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setErro(null);
    onEntrar(resultado.sessao);
  }

  return (
    <div className="brisa-login">
      <div className="brisa-login__shell">
        <div className="brisa-login__card">
          <div className="brisa-login__header">
            <span className="brisa-login__eyebrow">Bem-vindo de volta</span>
            <h1 className="brisa-login__title">Entrar na conta</h1>
            <p className="brisa-login__subtitle">
              Use o e-mail e a senha cadastrados no sistema.
            </p>
          </div>

          <form className="brisa-login__form" onSubmit={handleSubmit} noValidate>
            {erro ? (
              <div className="brisa-login__alert" role="alert">
                <Icon name="alert-circle" size={16} />
                <span>{erro}</span>
              </div>
            ) : null}

            <Field label="E-mail" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={email}
                invalid={Boolean(erro)}
                disabled={enviando}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErro(null);
                }}
                autoFocus
              />
            </Field>

            <Field label="Senha" htmlFor="login-senha">
              <div className="brisa-login__password">
                <Input
                  id="login-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={senha}
                  invalid={Boolean(erro)}
                  disabled={enviando}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErro(null);
                  }}
                />
                <button
                  type="button"
                  className="brisa-login__password-toggle"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Icon name={mostrarSenha ? 'eye-off' : 'eye'} size={17} />
                </button>
              </div>
            </Field>

            <div className="brisa-login__row">
              <Checkbox
                label="Manter conectado"
                checked={manterConectado}
                onChange={(e) => setManterConectado(e.target.checked)}
              />
              <button
                type="button"
                className="brisa-login__link"
                onClick={() =>
                  setErro(
                    'Recuperação de senha estará disponível em breve.',
                  )
                }
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="brisa-login__submit"
              disabled={enviando}
            >
              {enviando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="brisa-login__footer">
          Roster Team
        </p>
      </div>
    </div>
  );
}
