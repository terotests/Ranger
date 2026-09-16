'use client';

import React from 'react';
import { createElement, useState, useRef } from 'react';
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

export function usePos() {
  return useRef(null);
}
