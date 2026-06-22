import type { CSSProperties } from 'react';
import { CircleHelp } from 'lucide-react';
import { iconRegistry, isIconName, type IconName } from './iconRegistry';
import './Icon.css';

interface IconProps {
  /** Nome do ícone (compatível com os nomes legados do Tabler). */
  name: IconName | (string & {});
  /** Tamanho em pixels. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Rótulo acessível. Se omitido, o ícone é tratado como decorativo. */
  label?: string;
}

export function Icon({ name, size = 16, className = '', style, label }: IconProps) {
  const LucideIcon = isIconName(name) ? iconRegistry[name] : null;

  if (!LucideIcon) {
    if (import.meta.env.DEV) {
      console.warn(`[Icon] Ícone desconhecido: "${name}"`);
    }
    return (
      <CircleHelp
        size={size}
        className={`brisa-icon${className ? ` ${className}` : ''}`}
        style={style}
        aria-hidden={label ? undefined : true}
        role={label ? 'img' : undefined}
        aria-label={label}
      />
    );
  }

  return (
    <LucideIcon
      size={size}
      className={`brisa-icon${className ? ` ${className}` : ''}`}
      style={style}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    />
  );
}

export type { IconName };
