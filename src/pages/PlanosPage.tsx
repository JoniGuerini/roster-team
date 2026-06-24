import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import './PlanosPage.css';

type CicloCobranca = 'mensal' | 'anual';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  precoMensal: number;
  destaque?: boolean;
  recursos: string[];
}

const PLANOS: Plano[] = [
  {
    id: 'essencial',
    nome: 'Essencial',
    descricao: 'Ideal para uma unidade com equipe enxuta.',
    precoMensal: 199,
    recursos: [
      '1 local',
      'Até 15 funcionários',
      'Escala e turnos',
      '3 usuários',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    descricao: 'Operação completa com extras, alertas e mais controle.',
    precoMensal: 349,
    destaque: true,
    recursos: [
      '2 locais',
      'Funcionários e extras ilimitados',
      'Notificações inteligentes',
      'Usuários ilimitados',
      'Auditoria de atividades',
      'Suporte prioritário',
    ],
  },
  {
    id: 'multi',
    nome: 'Multi-unidade',
    descricao: 'Para redes e operações com vários pontos.',
    precoMensal: 599,
    recursos: [
      'Locais ilimitados',
      'Tudo do Profissional',
      'Perfis de acesso avançados',
      'Onboarding dedicado',
      'Gerente de conta',
    ],
  },
];

const MESES_GRATIS_ANUAL = 2;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function precoExibido(plano: Plano, ciclo: CicloCobranca): number {
  if (ciclo === 'mensal') return plano.precoMensal;
  return plano.precoMensal * (12 - MESES_GRATIS_ANUAL);
}

function precoMensalEquivalente(plano: Plano, ciclo: CicloCobranca): number | null {
  if (ciclo === 'mensal') return null;
  return Math.round(precoExibido(plano, ciclo) / 12);
}

export function PlanosPage() {
  const [ciclo, setCiclo] = useState<CicloCobranca>('mensal');
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [checkoutAberto, setCheckoutAberto] = useState(false);

  function abrirCheckout(plano: Plano) {
    setPlanoSelecionado(plano);
    setCheckoutAberto(true);
  }

  function fecharCheckout() {
    setCheckoutAberto(false);
    setPlanoSelecionado(null);
  }

  const totalCheckout = planoSelecionado
    ? precoExibido(planoSelecionado, ciclo)
    : 0;

  return (
    <div className="brisa-page brisa-planos">
      <header className="brisa-planos__hero">
        <div className="brisa-planos__hero-copy">
          <span className="brisa-planos__eyebrow">Assinatura</span>
          <h2 className="brisa-planos__headline">
            Escolha o plano ideal para sua operação
          </h2>
          <p className="brisa-planos__lede">
            Protótipo de checkout — nenhum pagamento real será processado.
            Use para validar layout, preços e fluxo de assinatura.
          </p>
        </div>

        <div className="brisa-planos__billing">
          <SegmentedControl
            value={ciclo}
            onChange={setCiclo}
            ariaLabel="Ciclo de cobrança"
            className="brisa-planos__billing-toggle"
            options={[
              { value: 'mensal', label: 'Mensal' },
              {
                value: 'anual',
                label: 'Anual',
                badge: (
                  <span className="brisa-planos__save-pill">
                    2 meses grátis
                  </span>
                ),
              },
            ]}
          />
        </div>
      </header>

      <div className="brisa-planos__grid">
        {PLANOS.map((plano) => {
          const preco = precoExibido(plano, ciclo);
          const mensalEq = precoMensalEquivalente(plano, ciclo);

          return (
            <article
              key={plano.id}
              className={`brisa-planos__card${plano.destaque ? ' brisa-planos__card--featured' : ''}`}
            >
              {plano.destaque ? (
                <span className="brisa-planos__badge">Mais popular</span>
              ) : null}

              <div className="brisa-planos__card-head">
                <h3 className="brisa-planos__card-title">{plano.nome}</h3>
                <p className="brisa-planos__card-desc">{plano.descricao}</p>
              </div>

              <div className="brisa-planos__price">
                <span className="brisa-planos__price-value">
                  {formatarMoeda(preco)}
                </span>
                <span className="brisa-planos__price-period">
                  {ciclo === 'mensal' ? '/mês' : '/ano'}
                </span>
                {mensalEq != null ? (
                  <span className="brisa-planos__price-equiv">
                    equivalente a {formatarMoeda(mensalEq)}/mês
                  </span>
                ) : null}
              </div>

              <ul className="brisa-planos__features">
                {plano.recursos.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plano.destaque ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onClick={() => abrirCheckout(plano)}
              >
                {plano.destaque ? 'Assinar agora' : 'Escolher plano'}
              </Button>
            </article>
          );
        })}
      </div>

      <p className="brisa-planos__footnote">
        Valores ilustrativos para teste de interface. Impostos, implantação e
        condições comerciais podem variar no contrato final.
      </p>

      <Modal
        open={checkoutAberto}
        onClose={fecharCheckout}
        title="Finalizar assinatura"
        description="Protótipo — o pagamento não será cobrado."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={fecharCheckout}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              leftIcon={<Icon name="lock" size={16} />}
              onClick={fecharCheckout}
            >
              Pagar {formatarMoeda(totalCheckout)}
            </Button>
          </>
        }
      >
        {planoSelecionado ? (
          <div className="brisa-planos__checkout">
            <div className="brisa-planos__checkout-resumo">
              <div>
                <span className="brisa-planos__checkout-label">Plano</span>
                <strong>{planoSelecionado.nome}</strong>
              </div>
              <div>
                <span className="brisa-planos__checkout-label">Cobrança</span>
                <strong>{ciclo === 'mensal' ? 'Mensal' : 'Anual'}</strong>
              </div>
              <div>
                <span className="brisa-planos__checkout-label">Total</span>
                <strong className="brisa-planos__checkout-total">
                  {formatarMoeda(totalCheckout)}
                </strong>
              </div>
            </div>

            <div className="brisa-planos__checkout-form">
              <label className="brisa-planos__field">
                <span>Nome no cartão</span>
                <input type="text" placeholder="Maria Silva" disabled />
              </label>
              <label className="brisa-planos__field">
                <span>Número do cartão</span>
                <input type="text" placeholder="0000 0000 0000 0000" disabled />
              </label>
              <div className="brisa-planos__field-row">
                <label className="brisa-planos__field">
                  <span>Validade</span>
                  <input type="text" placeholder="MM/AA" disabled />
                </label>
                <label className="brisa-planos__field">
                  <span>CVV</span>
                  <input type="text" placeholder="123" disabled />
                </label>
              </div>
            </div>

            <p className="brisa-planos__checkout-hint">
              <Icon name="info-circle" size={16} />
              Campos desabilitados neste protótipo. Integração com gateway de
              pagamento virá em uma etapa posterior.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
