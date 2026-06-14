import type { CSSProperties } from 'react';

interface IconProps {
  /** Nome do ícone Tabler sem o prefixo, ex.: "plus", "user-plus". */
  name: string;
  /** Tamanho em pixels (define o font-size do glifo). */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Rótulo acessível. Se omitido, o ícone é tratado como decorativo. */
  label?: string;
}

export function Icon({ name, size, className = '', style, label }: IconProps) {
  const classes = `ti ti-${name}${className ? ` ${className}` : ''}`;
  const estilo: CSSProperties | undefined =
    size != null ? { fontSize: size, ...style } : style;

  return (
    <i
      className={classes}
      style={estilo}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    />
  );
}
