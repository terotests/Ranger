'use client';

import { createElement, useState } from 'react';
import { render } from 'react-dom';

export function Page() {
  return createElement('div');
}

export function mount(el: any) {
  render(createElement('div'), el);
}

export function useCount() {
  return useState(0);
}
