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
const boxedMember = React.useRef<{ x: number; y: number } | null>(null);
const boxedStr = React.useState<'on' | 'off'>('off');
const identity = <T>(value: T) => value;
const isNum = (value: any): value is number => typeof value === 'number';

function lessThan(n: number) {
  return n < 0 || n < 1;
}

const NamedFn = function NamedFn() {
  return 1;
};

const Wrapped = React.forwardRef<HTMLElement, object>(function Wrapped(_props: object, _ref: unknown) {
  return <div />;
});

export function ClientBanner() {
  return <div className={cn('ok')} />;
}

export { box, type Lead };
export { type Click, type Handler } from './types';
