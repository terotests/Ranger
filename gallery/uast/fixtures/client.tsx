'use client';

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type Handler = (...args: string[]) => void;
type Lead = | string | number;
type Obj = {
  delete?: boolean;
  finally?: () => void;
  'quoted-key': string;
};
type Click = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;

export function ClientBanner() {
  return <div className={cn('ok')} />;
}
