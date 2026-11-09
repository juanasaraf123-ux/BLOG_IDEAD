# Portal institucional IDEAD – Universidad del Tolima

Portal de información, indicadores y gestión del Instituto de Educación a Distancia (IDEAD): portal público con 13 módulos de indicadores y panel privado de administración con flujo de revisión y publicación.

## Estado

**Fase 1 — Análisis y planificación (en espera de aprobación).** Todavía no hay código de la aplicación.

| Documento | Contenido |
|---|---|
| [docs/fase-1/01-diagnostico-tecnico.md](docs/fase-1/01-diagnostico-tecnico.md) | Diagnóstico, hallazgos, arquitectura, navegación, decisiones pendientes y plan por fases |
| [docs/fase-1/02-matriz-indicadores.md](docs/fase-1/02-matriz-indicadores.md) | Los 76 indicadores del Excel asignados a módulo, ruta, visualización, filtros, fuente y nivel de publicación ([CSV](docs/fase-1/matriz-indicadores.csv)) |
| [docs/fase-1/03-modelo-datos-preliminar.md](docs/fase-1/03-modelo-datos-preliminar.md) | Modelo entidad-relación preliminar |
| [docs/fase-1/04-roles-permisos.md](docs/fase-1/04-roles-permisos.md) | RBAC: roles, permisos y flujo de publicación |
| [docs/fase-1/05-compatibilidad-tecnologica.md](docs/fase-1/05-compatibilidad-tecnologica.md) | Requisitos de servidor, escenarios de despliegue, posición frente a PHP 5.6 |
| [docs/referencias/Indicadores_Sugeridos.xlsx](docs/referencias/Indicadores_Sugeridos.xlsx) | Documento fuente de requerimientos de información |

La matriz se regenera desde el Excel con:

```bash
python3 scripts/generar_matriz_indicadores.py docs/referencias/Indicadores_Sugeridos.xlsx docs/fase-1/02-matriz-indicadores.md docs/fase-1/matriz-indicadores.csv
```
