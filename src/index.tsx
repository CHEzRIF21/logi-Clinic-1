import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/providers/ThemeProvider';

// #region agent log (debug-session)
// Instrumentation globale: capture console.error + erreurs runtime + échecs réseau,
// et "flush" dès que la connexion revient (événement `online`).
// IMPORTANT: ne pas logger de secrets/PII.
(() => {
  const ENDPOINT =
    'http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f';
  const sessionId = 'debug-session';
  const runId = 'run1';

  const safeStr = (v: unknown, max = 160) => {
    try {
      if (v instanceof Error) return `${v.name}: ${v.message}`.slice(0, max);
      if (typeof v === 'string') return v.slice(0, max);
      if (typeof v === 'number' || typeof v === 'boolean' || v == null)
        return String(v);
      return Object.prototype.toString.call(v).slice(0, max);
    } catch {
      return '[unserializable]';
    }
  };

  const sanitizeUrl = (u: unknown) => {
    try {
      const s = typeof u === 'string' ? u : (u as any)?.url;
      if (!s) return 'unknown';
      const url = new URL(s, window.location.origin);
      url.search = '';
      return url.toString();
    } catch {
      return 'invalid-url';
    }
  };

  const send = (hypothesisId: string, location: string, message: string, data: any) => {
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          runId,
          hypothesisId,
          location,
          message,
          data,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  // Buffer local (pour "récupérer ces erreurs" au retour de connexion)
  const buffer: Array<{ t: number; kind: string; msg: string }> = [];
  const pushBuffer = (kind: string, msg: string) => {
    buffer.push({ t: Date.now(), kind, msg: msg.slice(0, 220) });
    if (buffer.length > 30) buffer.splice(0, buffer.length - 30);
  };

  // 1) Init
  send('A', 'src/index.tsx:init', 'global_console_capture_init', {
    online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
  });

  // 2) console.error interception (sans sérialiser les objets)
  const origConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const preview = args.slice(0, 3).map((a) => safeStr(a));
    const msg = preview.join(' | ');
    pushBuffer('console.error', msg);
    send('B', 'src/index.tsx:console.error', 'console_error', { preview });
    origConsoleError(...args);
  };

  // 3) window error
  window.addEventListener('error', (ev) => {
    const err = (ev as any)?.error as Error | undefined;
    const msg = safeStr(err ?? (ev as any)?.message ?? 'window.error');
    pushBuffer('window.error', msg);
    send('C', 'src/index.tsx:window.error', 'window_error', {
      message: (ev as any)?.message,
      filename: (ev as any)?.filename,
      lineno: (ev as any)?.lineno,
      colno: (ev as any)?.colno,
      error: err ? { name: err.name, message: err.message, stack: (err.stack || '').slice(0, 220) } : undefined,
    });
  });

  // 4) unhandled promise rejection
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = (ev as any)?.reason;
    const msg = safeStr(reason);
    pushBuffer('unhandledrejection', msg);
    send('D', 'src/index.tsx:unhandledrejection', 'unhandled_rejection', {
      reason: safeStr(reason, 220),
    });
  });

  // 5) fetch wrapper (ne casse pas supabase; garde la signature)
  const origFetch = globalThis.fetch?.bind(globalThis);
  if (origFetch) {
    globalThis.fetch = async (...args: any[]) => {
      const url = sanitizeUrl(args[0]);
      const t0 = Date.now();
      try {
        const res = await origFetch(...args);
        if (!res.ok) {
          const msg = `${res.status} ${res.statusText} @ ${url}`;
          pushBuffer('fetch.non_ok', msg);
          // Tenter de lire un payload d'erreur PostgREST (sans données sensibles)
          let errShape: any = undefined;
          try {
            if (url.includes('/rest/v1/') || url.includes('/rpc/')) {
              const cloned = res.clone();
              const ctype = cloned.headers.get('content-type') || '';
              if (ctype.includes('application/json')) {
                const j = await cloned.json();
                // PostgREST: { code, message, details, hint }
                if (j && typeof j === 'object') {
                  errShape = {
                    code: (j as any).code,
                    message: (j as any).message ? String((j as any).message).slice(0, 220) : undefined,
                    hint: (j as any).hint ? String((j as any).hint).slice(0, 220) : undefined,
                    details: (j as any).details ? String((j as any).details).slice(0, 220) : undefined,
                  };
                }
              }
            }
          } catch {
            // ignore
          }

          send('E', 'src/index.tsx:fetch', 'fetch_non_ok', {
            url,
            status: res.status,
            statusText: res.statusText,
            ms: Date.now() - t0,
            online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
            err: errShape,
          });
        }
        return res;
      } catch (err: any) {
        const msg = `${safeStr(err)} @ ${url}`;
        pushBuffer('fetch.throw', msg);
        send('F', 'src/index.tsx:fetch', 'fetch_throw', {
          url,
          error: safeStr(err, 220),
          ms: Date.now() - t0,
          online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
        });
        throw err;
      }
    };
  }

  // 6) flush au retour de connexion
  window.addEventListener('online', () => {
    const tail = buffer.slice(-8);
    send('G', 'src/index.tsx:online', 'online_flush', {
      bufferedCount: buffer.length,
      last: tail,
    });
    // Affichage bref en console (résumé), utile pour "inspecter la console"
    if (tail.length) {
      // eslint-disable-next-line no-console
      console.warn('[LogiClinic] Résumé erreurs récentes (flush online):', tail);
    }
  });
})();
// #endregion agent log (debug-session)

// Ajouter la police Inter depuis Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SnackbarProvider maxSnack={3}>
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
