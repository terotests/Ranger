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

function box<T>(value: T): T {
  return value;
}

const boxed = box<{ x: number; y: string } | null>(null);
const identity = <T>(value: T) => value;

export function ClientBanner() {
  return <div className={cn('ok')} />;
}
