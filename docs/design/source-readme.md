# Sistema de Diseño — Archivos

Sistema unificado derivado de 20 pantallas existentes. Tema base: **dark mode**.

## Contenido

| Archivo | Qué es | Para quién |
|---|---|---|
| `SISTEMA-DE-DISENO.md` | Análisis completo: principios, color, tipografía, componentes, mapa pantalla↔componente, registro de incongruencias y checklist | Diseño + producto + dev |
| `tokens.css` | Design tokens como CSS custom properties (`--primary-500`, etc.) | Dev (cualquier stack) |
| `tokens.json` | Mismos tokens en JSON (estilo W3C, apto para Style Dictionary) | Pipelines de tokens / multiplataforma |
| `tailwind.config.js` | Configuración de Tailwind con la paleta, radios, tipografía y sombras del sistema | Dev (Tailwind) |

## Reglas de oro (resumen)

1. **Azul `#2D7FF9`** = primario, acción e info.
2. **Verde `#1D9E75`** = solo dinero y estados de éxito/completado.
3. **Ámbar `#EF9F27`** = solo aviso/pendiente.
4. **Rojo `#E24B4A`** = solo error y acciones destructivas (eliminar).
5. **Gremios** = chip neutro, diferenciados solo por texto.
6. **Botones** = radio medio (12px), no cápsula.
7. **Inter** para UI, **Space Grotesk** solo para cifras grandes.

## Empezar

- Si usas Tailwind: copia `tailwind.config.js` y carga las fuentes Inter + Space Grotesk.
- Si no: importa `tokens.css` en tu hoja global y usa las variables.
- Lee primero la sección 7 del `.md` (incongruencias corregidas) para no reintroducir los problemas del diseño original.
