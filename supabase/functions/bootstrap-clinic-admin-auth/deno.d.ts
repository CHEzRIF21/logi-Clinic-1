// Déclarations de types pour Deno
// Ce fichier aide l'IDE à reconnaître les APIs Deno

/// <reference types="https://deno.land/x/types/index.d.ts" />

declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
    export function set(key: string, value: string): void;
  }
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
};

