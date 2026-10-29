/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** POST endpoint for the registration form (Formspree, a serverless function…). */
  readonly PUBLIC_JOIN_ENDPOINT?: string;
  /** POST endpoint for the "ask a question" form. */
  readonly PUBLIC_ASK_ENDPOINT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
