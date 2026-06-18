import './EmpresaLogo.css';

interface EmpresaLogoProps {
  nome: string;
  logoUrl: string | null;
  corPrimaria: string;
  size?: number;
  radius?: number;
}

export function iniciaisEmpresa(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function EmpresaLogo({
  nome,
  logoUrl,
  corPrimaria,
  size = 48,
  radius,
}: EmpresaLogoProps) {
  const borderRadius = radius ?? Math.round(size * 0.28);
  const style = {
    width: size,
    height: size,
    borderRadius,
  } as const;

  if (logoUrl) {
    return (
      <span className="brisa-empresa-logo" style={style}>
        <img src={logoUrl} alt={`Logo de ${nome}`} />
      </span>
    );
  }

  return (
    <span
      className="brisa-empresa-logo brisa-empresa-logo--iniciais"
      style={{
        ...style,
        background: corPrimaria,
        fontSize: Math.round(size * 0.4),
      }}
      aria-label={`Logo de ${nome}`}
      role="img"
    >
      {iniciaisEmpresa(nome)}
    </span>
  );
}
