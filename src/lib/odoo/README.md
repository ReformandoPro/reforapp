# Odoo Integration

Odoo 18 será tratado como ERP externo integrado, no como core de Reformando.

Esta carpeta alojará el conector desacoplado con Odoo para:
- contactos fiscales,
- productos base,
- proveedores,
- compras reales,
- inventario real,
- facturación,
- contabilidad,
- empleados.

No debe incluir lógica del motor presupuestario ni lógica operativa de obra.

No implementar llamadas reales a Odoo hasta que estén definidas las variables de entorno, el usuario técnico, los permisos y el primer flujo de sincronización.
