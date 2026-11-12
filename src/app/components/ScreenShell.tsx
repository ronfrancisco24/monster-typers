import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children: ReactNode;
}

export default function ScreenShell({ title, subtitle, meta, children }: Props) {
  return (
    <section className="screen">
      <header className="screen__header">
        <div className="screen__heading">
          <h1 className="screen__title">{title}</h1>
          {subtitle !== undefined && <p className="screen__subtitle">{subtitle}</p>}
        </div>
        {meta !== undefined && <div className="screen__meta">{meta}</div>}
      </header>
      <div className="screen__body">{children}</div>
    </section>
  );
}
