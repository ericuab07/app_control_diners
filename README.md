# Control de diners

App web de finances personals: balanç, ingressos, despeses, accions, pressupostos i estadístiques.
Funciona al mòbil (instal·lable com a app) i a l'ordinador, amb les dades sincronitzades via Supabase.

```bash
npm install
npm run dev     # http://localhost:3000
npm test
```

Les variables de `.env` (URL i clau pública de Supabase) ja hi són. Per desplegar: importa el
repositori a Vercel; no cal cap configuració addicional.

Detalls d'arquitectura i estat del projecte a [CLAUDE.md](CLAUDE.md).
