# EvidenciaMed — Frontend

React/Vite frontend para EvidenciaMed.

## Variables de entorno

Crear `.env.local` en desarrollo (ver `.env.example`):

```
VITE_API_URL=https://evidenciamed-backend.onrender.com
VITE_API_KEY=em-prod-CAMBIA_ESTO
```

En **Vercel Dashboard** → Settings → Environment Variables → agregar las mismas dos variables.

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy Vercel

1. Push a GitHub
2. Importar en vercel.com
3. Agregar variables de entorno
4. Deploy automático en cada push a `main`

## Flujo de análisis

- **Por DOI** → el backend consulta CrossRef + Unpaywall → extrae texto → Claude analiza
- **Por texto** → pegas el abstract directamente → Claude analiza
- 
