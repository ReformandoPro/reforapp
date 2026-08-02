# Roadmap de producto — Reformando.app

## Catálogo multi-proveedor y aprovisionamiento asistido — OBRAMAT

- **Clasificación:** Post-MVP.
- **Prioridad:** Alta para la v1 comercial.
- **Estado:** Iniciativa documentada; no bloquea la beta actual.
- **Fuente:** análisis documental de viabilidad técnica y contractual de la integración Reformando × OBRAMAT, incorporado en este roadmap.

### Decisiones aprobadas

1. No implementar scraping masivo o recurrente sin autorización.
2. El MVP será de captura asistida, con una ficha de producto por acción.
3. Toda captura tendrá previsualización y confirmación humana antes de guardar.
4. No se automatizarán compras.
5. El dominio interno modelará proveedores, almacenes, productos, formatos, precios históricos, stock observado, equivalencias y listas de compra.
6. Precio y stock se tratarán como observaciones fechadas, no como valores permanentes.
7. Una futura API o feed autorizado sustituirá únicamente el adaptador de ingesta.
8. Se abrirá en paralelo una vía comercial formal con OBRAMAT.
9. Será obligatoria la revisión legal antes de cualquier automatización sistemática.

### Roadmap por fases

#### Fase 1 — Catálogo interno

- Importación CSV.
- Captura manual.
- Incorporación desde tickets y facturas.
- Códigos de barras.
- Normalización de productos.
- Listas de compra por obra.

#### Fase 2 — Captura asistida

- Extensión o bookmarklet.
- Una ficha por acción.
- Almacén seleccionado explícitamente.
- Precio, formato, stock y fecha de observación.
- Previsualización y confirmación antes de guardar.

#### Fase 3 — Integración autorizada

- API o feed B2B autorizado.
- Precios y stock por almacén.
- Listas o presupuestos.
- Posible generación de pedidos, únicamente tras autorización de producto y negocio.
- Acuerdo comercial o afiliación.

#### Fase 4 — Optimización

- Comparación de alternativas.
- Cálculo de cantidades y formatos.
- Consolidación de pedidos.
- Recomendación por precio, disponibilidad y distancia.

### Riesgos y controles

- **Riesgos contractuales:** no automatizar ingesta sistemática ni compras sin autorización expresa, acuerdo comercial y revisión legal.
- **Caducidad de precios:** guardar cada precio como observación fechada, con fuente y almacén; nunca tratarlo como precio vigente indefinido.
- **Stock no garantizado:** mostrar fecha y contexto del stock observado, sin prometer disponibilidad.
- **Errores de unidad o formato:** normalizar unidad de medida, contenido, formato y equivalencias; exigir confirmación humana ante ambigüedad.
- **Dependencia del proveedor:** mantener un dominio multi-proveedor y adaptadores desacoplados para poder sustituir OBRAMAT por otra fuente.
- **Duplicados y equivalencias:** conservar identificadores de proveedor y un catálogo interno canónico con relaciones de equivalencia auditables.

### Fuera de alcance de la beta

- Scraping masivo o recurrente.
- Automatización de compras o pedidos.
- Integración técnica no autorizada con OBRAMAT.
- Cambios de esquema, conectores o jobs de ingesta productivos.
