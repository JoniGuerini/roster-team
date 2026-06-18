import './AppLogo.css';

interface AppLogoProps {
  size?: number;
  className?: string;
  /** Versão para fundos escuros (login). Padrão: clara. */
  variant?: 'light' | 'dark';
}

export function AppLogo({
  size = 48,
  className = '',
  variant = 'light',
}: AppLogoProps) {
  const classes = [
    'brisa-app-logo',
    variant === 'dark' ? 'brisa-app-logo--dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        className="brisa-app-logo__arc"
        d="M7 31.5C12.5 14.5 35.5 14.5 41 31.5"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <rect
        className="brisa-app-logo__block brisa-app-logo__block--1"
        x="9"
        y="29"
        width="9"
        height="11"
        rx="2.5"
      />
      <rect
        className="brisa-app-logo__block brisa-app-logo__block--2"
        x="19.5"
        y="23"
        width="9"
        height="17"
        rx="2.5"
      />
      <rect
        className="brisa-app-logo__block brisa-app-logo__block--3"
        x="30"
        y="26.5"
        width="9"
        height="13.5"
        rx="2.5"
      />
      <circle className="brisa-app-logo__dot" cx="24" cy="16.5" r="2.75" />
    </svg>
  );
}
