// JavaScript ES6+ Modules and Modern Features Test File
// Tests: import/export, optional chaining, nullish coalescing
// ============================================
// ES6 Modules - Import Statements
// ============================================
// Side-effect only import
import "polyfill";
// Default import
import React from "react";
// Named imports
import { useState, useEffect } from "react";
// Named import with alias
import { Component as ReactComponent } from "react";
// Namespace import
import * as utils from "./utils";
// Default + named imports
import express, { Router, Request } from "express";
// Default + namespace import
import lodash, * as _ from "lodash";
// Multiple named imports with aliases
import { readFile as read, writeFile as write } from "fs";
// ============================================
// ES6 Modules - Export Statements
// ============================================
// Export named variable declarations
export const API_VERSION = '1.0.0';
export let counter = 0;
export var legacy = true;
// Export function declaration
export function add(a, b) {
  return (a + b);
};
// Export async function
export async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
};
// Export class declaration
export class Calculator {
  constructor() {
    this.result = 0;
  }
  add(n) {
    this.result = (this.result + n);
    return this;
  }
};
// Named exports (list)
const PI = 3.14159;
const E = 2.71828;
export { PI, E };
// Named exports with aliases
const internalName = 'secret';
export { internalName as publicName };
// Re-export from another module
export { default as Button } from "./components/Button";
export { useState } from "react";
// Re-export all
export * from "./helpers";
export * as helpers from "./helpers";
// Default export - expression
export default function main() {
  console.log('Main function');
};
// ============================================
// Optional Chaining (?.)
// ============================================
const user = { name: 'John', address: { street: '123 Main St', city: 'Boston' } };
// Optional property access
const street = user?.address?.street;
const zip = user?.address?.zipCode;
const country = user?.address?.country?.name;
// Optional bracket notation
const key = 'name';
const userName = user?.[key];
const nested = user?.['address']?.['city'];
// Optional method calls
const result = user?.getName?.();
const length = user?.name?.toUpperCase?.();
// Chained optional calls
const api = { getData: () => { items: [1, 2, 3] } };
const items = api?.getData?.()?.items;
// Optional chaining with arrays
const arr = [1, 2, 3];
const first = arr?.[0];
const last = arr?.[(arr.length - 1)];
// Deep optional chaining
const config = { database: { connection: { host: 'localhost' } } };
const host = config?.database?.connection?.host;
const port = config?.database?.connection?.port;
// ============================================
// Nullish Coalescing (??)
// ============================================
// Basic nullish coalescing
const value1 = (null ?? 'default');
const value2 = (undefined ?? 'default');
const value3 = (0 ?? 'default');
const value4 = ('' ?? 'default');
const value5 = (false ?? 'default');
// Nullish coalescing with variables
const input = null;
const output = (input ?? 'fallback');
// Chained nullish coalescing
const a = null;
const b = undefined;
const c = 'value';
const result2 = ((a ?? b) ?? c);
// Nullish coalescing with optional chaining
const userConfig = null;
const theme = (userConfig?.theme ?? 'light');
const fontSize = (userConfig?.settings?.fontSize ?? 14);
// Nullish coalescing vs OR
const count = 0;
const displayCount = (count ?? 10);
const displayCountOr = (count || 10);
// Nullish coalescing with function calls
function getDefault() {
  return 'computed default';
}
const configured = null;
const final = (configured ?? getDefault());
// Nested nullish coalescing with optional chaining
const response = { data: null };
const data = (response?.data ?? []);
const message = (response?.error?.message ?? 'Unknown error');
// ============================================
// Combined Usage Examples
// ============================================
// Real-world example: API response handling
const apiResponse = { user: { profile: { avatar: null } } };
const avatarUrl = (apiResponse?.user?.profile?.avatar ?? '/default-avatar.png');
// Configuration with defaults
const appConfig = { api: { timeout: 0 } };
const timeout = (appConfig?.api?.timeout ?? 5000);
const retries = (appConfig?.api?.retries ?? 3);
// Safe method calling with defaults
const calculator = { compute: (a, b) => (a + b) };
const computeResult = (calculator?.compute?.(5, 3) ?? 0);
// Array access with defaults
const users = [];
const firstUser = (users?.[0] ?? { name: 'Guest' });
const lastName = (users?.[0]?.lastName ?? 'Unknown');
// ==========================================
// Regular Expression Literals
// ==========================================
// Basic regex patterns
const simpleRegex = /hello/;
const caseInsensitive = /world/i;
const globalMatch = /test/g;
const multiFlags = /pattern/gim;
// Special characters in patterns
const digits = /\d+/;
const words = /\w+/g;
const whitespace = /\s*/;
const boundaries = /\bword\b/;
// Character classes
const vowels = /[aeiou]/;
const notDigits = /[^0-9]/;
const range = /[a-zA-Z0-9]/;
// Quantifiers
const oneOrMore = /a+/;
const zeroOrMore = /b*/;
const optional = /c?/;
const exactCount = /d{3}/;
const rangeCount = /e{2,5}/;
const minCount = /f{2,}/;
// Anchors and groups
const startEnd = /^start.*end$/;
const group = /(ab)+/;
const nonCapturing = /(?:cd)+/;
const alternation = /cat|dog/;
// Regex with forward slash in character class
const pathPattern = /[/\\]/;
const urlPattern = /https?:\/\//;
//;
// Regex method usage
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const isValid = emailRegex.test('test@example.com');
const matches = 'hello world'.match(/\w+/g);
const replaced = 'abc123'.replace(/\d+/, 'XXX');
// Regex in conditions
if (/^\d+$/.test('12345')) {
  console.log('All digits');
}
// Regex as function argument
const parts = 'a,b;c'.split(/[,;]/);
// Regex in array
const patterns = [/first/, /second/g, /third/i];
// Regex in object
const validators = { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, phone: /^\d{3}-\d{3}-\d{4}$/, zip: /^\d{5}(-\d{4})?$/ };
console.log('ES6 Modules, Modern Features, and Regex tests completed!');
