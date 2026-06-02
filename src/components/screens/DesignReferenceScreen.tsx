import styles from "./DesignReferenceScreen.module.css";

/**
 * DesignReferenceScreen
 *
 * INTERNAL REFERENCE ONLY.
 *
 * Constraints:
 * - No routing changes (never replace `/`).
 * - No new dependencies (e.g. lucide-react) until explicitly approved.
 * - No real data: everything inside this screen is static and for visual review only.
 */

type IconProps = {
  label: string;
};

function IconPlaceholder({ label }: IconProps) {
  return (
    <span className={styles.iconPlaceholder} aria-hidden="true" title={label}>
      {label}
    </span>
  );
}

const legend = [
  { label: "Primario", detail: "accion e info", color: "var(--primary-500)" },
  { label: "Exito", detail: "dinero y validacion", color: "var(--success-500)" },
  { label: "Aviso", detail: "pendiente", color: "var(--warning-500)" },
  { label: "Error", detail: "solo destructivo", color: "var(--danger-500)" },
  { label: "Gremios", detail: "neutro", color: "#4a5366" },
];

function PhoneHeader({
  title,
  action,
  centered = false,
}: {
  title: string;
  action?: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={styles.phoneHeader}>
      <div className={styles.headerLeft}>
        <button className={styles.iconButton} aria-label="Volver">
          <IconPlaceholder label="←" />
        </button>
        {!centered ? <div className={styles.headerTitle}>{title}</div> : null}
      </div>
      {centered ? <div className={styles.headerTitle}>{title}</div> : null}
      {action ?? <span className={styles.iconButton} />}
    </div>
  );
}

function BudgetPhone() {
  return (
    <div className={styles.phone}>
      <PhoneHeader title="Nuevo Presupuesto" action={<button className={styles.textAction}>Guardar</button>} />
      <div className={styles.phoneBody}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>
            <IconPlaceholder label="i" />
          </span>
          Informacion del Proyecto
        </div>
        <p className={styles.label}>Titulo del Proyecto</p>
        <div className={styles.input}>Ej. Reforma Integral Calle Mayor</div>
        <p className={styles.label}>Cliente</p>
        <div className={styles.input}>Nombre del cliente o empresa</div>

        <div className={styles.sectionRow}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>
              <IconPlaceholder label="≡" />
            </span>
            Partidas
          </div>
          <span className={styles.countBadge}>3 Partidas</span>
        </div>

        <div className={styles.budgetLine}>
          <div className={styles.lineTop}>
            <span className={styles.guildChip}>Albanileria</span>
          </div>
          <div className={styles.lineNameRow}>
            <div className={styles.lineName}>Demolicion de tabiques</div>
            <IconPlaceholder label="🗑" />
          </div>
          <div className={styles.lineMetrics}>
            <div>
              <p className={styles.metricLabel}>Cantidad</p>
              <div className={styles.metricValue}>
                <strong>45</strong>
                <span>m2</span>
              </div>
            </div>
            <div>
              <p className={styles.metricLabel}>Precio unid.</p>
              <div className={styles.metricValue}>
                <strong>12.50</strong>
                <span>€</span>
              </div>
            </div>
          </div>
          <div className={styles.subtotal}>
            <span>Subtotal</span>
            <strong>562,50 €</strong>
          </div>
        </div>

        <div className={styles.budgetLine}>
          <div className={styles.lineTop}>
            <span className={styles.guildChip}>Fontaneria</span>
          </div>
          <div className={styles.lineNameRow}>
            <div className={styles.lineName}>Instalacion de bano</div>
            <IconPlaceholder label="🗑" />
          </div>
          <div className={styles.lineMetrics}>
            <div>
              <p className={styles.metricLabel}>Cantidad</p>
              <div className={styles.metricValue}>
                <strong>1</strong>
                <span>ud</span>
              </div>
            </div>
            <div>
              <p className={styles.metricLabel}>Precio unid.</p>
              <div className={styles.metricValue}>
                <strong>1.350</strong>
                <span>€</span>
              </div>
            </div>
          </div>
          <div className={styles.subtotal}>
            <span>Subtotal</span>
            <strong>1.350,00 €</strong>
          </div>
        </div>
      </div>
      <div className={styles.stickyFooter}>
        <div className={styles.totalRow}>
          <div>
            <p className={styles.totalLabel}>Total Presupuestado</p>
            <div className={styles.totalAmount}>3.678,50 €</div>
          </div>
          <div className={styles.metricLabel}>IVA incluido</div>
        </div>
        <div className={styles.footerActions}>
          <button className={styles.secondaryButton}>
            <IconPlaceholder label="PDF" />
            PDF
          </button>
          <button className={styles.primaryButton}>
            <IconPlaceholder label="→" />
            Enviar Presupuesto
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfitPhone() {
  return (
    <div className={styles.phone}>
      <PhoneHeader
        title="RENTABILIDAD"
        centered
        action={
          <button className={styles.iconButton} aria-label="Compartir">
            <IconPlaceholder label="⇪" />
          </button>
        }
      />
      <div className={styles.phoneBody}>
        <div className={styles.profitHero}>
          <p className={styles.overline}>Beneficio neto</p>
          <p className={styles.profitAmount}>8.420,00 €</p>
          <span className={styles.successPill}>+ 24.5% Margen</span>
          <div className={styles.profitSplit}>
            <div>
              <p className={styles.splitLabel}>Ingresos totales</p>
              <div className={styles.splitValue}>34.425,00 €</div>
            </div>
            <div className={styles.splitLine} />
            <div>
              <p className={styles.splitLabel}>Gastos totales</p>
              <div className={styles.splitValue}>26.005,00 €</div>
            </div>
          </div>
        </div>

        <div className={styles.chartGrid}>
          <div className={styles.chartCard}>
            <div className={styles.donut}>
              <div className={styles.donutInner}>24%</div>
            </div>
            <div className={styles.chartLabel}>Margen beneficio</div>
          </div>
          <div className={styles.chartCard}>
            <div
              className={styles.donut}
              style={{
                background:
                  "conic-gradient(var(--primary-300) 0 270deg, rgba(255,255,255,.08) 270deg 360deg)",
              }}
            >
              <div className={styles.donutInner}>
                <IconPlaceholder label="⋮" />
              </div>
            </div>
            <div className={styles.chartLabel}>Material / Personal</div>
          </div>
        </div>

        <div className={styles.categoryHeader}>
          <span className={styles.overline}>Desglose por categoria</span>
          <span className={styles.percent}>Gastos Directos</span>
        </div>
        {[
          ["Fontaneria", "4.280 €", "28%"],
          ["Albanileria", "12.450 €", "78%"],
          ["Electricidad", "3.380 €", "34%"],
        ].map(([name, amount, pct]) => (
          <div className={styles.categoryRow} key={name}>
            <div className={styles.categoryName}>{name}</div>
            <div className={styles.categoryAmount}>{amount}</div>
            <div className={styles.categoryPct}>{pct}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientPhone() {
  return (
    <div className={styles.phone}>
      <PhoneHeader
        title="PORTAL CLIENTE"
        centered
        action={
          <button className={styles.iconButton} aria-label="Usuario">
            <IconPlaceholder label="👤" />
          </button>
        }
      />
      <div className={styles.phoneBody}>
        <div className={styles.clientHero}>
          <div className={styles.clientTitle}>Reforma Calle Mayor</div>
          <div className={styles.clientSub}>Estado del proyecto y avances</div>
          <div className={styles.clientStats}>
            <div>
              <div className={styles.statValue}>68%</div>
              <div className={styles.statLabel}>Progreso</div>
            </div>
            <div>
              <div className={styles.statValue}>12</div>
              <div className={styles.statLabel}>Tareas</div>
            </div>
            <div>
              <div className={styles.statValue}>3</div>
              <div className={styles.statLabel}>Incidencias</div>
            </div>
          </div>
        </div>

        <div className={styles.timelineHeader}>
          <span className={styles.overline}>Linea de tiempo</span>
          <span className={styles.muted}>Ultimas actualizaciones</span>
        </div>

        {["Demolicion completada", "Materiales entregados", "Instalacion electrica"].map((item, idx) => (
          <div className={styles.timelineItem} key={item}>
            <div className={styles.timelineDot} data-tone={idx === 2 ? "current" : "done"} />
            <div className={styles.timelineCard}>
              <div className={styles.timelineTitle}>{item}</div>
              <div className={styles.timelineMeta}>Hoy · 10:{idx}0</div>
            </div>
          </div>
        ))}

        <div className={styles.clientActions}>
          <button className={styles.secondaryButton}>
            <IconPlaceholder label="🖼" />
            Fotos
          </button>
          <button className={styles.secondaryButton}>
            <IconPlaceholder label="📅" />
            Visita
          </button>
          <button className={styles.primaryButton}>
            <IconPlaceholder label="✉" />
            Mensaje
          </button>
        </div>
      </div>
    </div>
  );
}

export function DesignReferenceScreen() {
  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.kicker}>Sistema de Diseno — Referencia</p>
        <h1 className={styles.title}>Direccion visual (interna)</h1>
        <p className={styles.subtitle}>
          Esta pagina es una referencia interna para validar atmosfera, profundidad, jerarquia y componentes. No sustituye
          pantallas reales ni conecta datos.
        </p>
      </div>

      <div className={styles.legend}>
        {legend.map((item) => (
          <div className={styles.legendChip} key={item.label}>
            <span className={styles.swatch} style={{ background: item.color }} />
            <div>
              <b>{item.label}</b>
              <span className={styles.legendDetail}>{item.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.gallery}>
        <div className={styles.screenCell}>
          <div className={styles.caption}>
            <p className={styles.captionType}>PANTALLA</p>
            <p className={styles.captionName}>Nuevo Presupuesto</p>
            <p className={styles.captionNote}>Inputs, chips de gremio y CTA azul con sombra.</p>
          </div>
          <BudgetPhone />
        </div>

        <div className={styles.screenCell}>
          <div className={styles.caption}>
            <p className={styles.captionType}>PANTALLA</p>
            <p className={styles.captionName}>Rentabilidad</p>
            <p className={styles.captionNote}>Hero num\u00e9rico + verde solo para beneficio/validacion.</p>
          </div>
          <ProfitPhone />
        </div>

        <div className={styles.screenCell}>
          <div className={styles.caption}>
            <p className={styles.captionType}>PANTALLA</p>
            <p className={styles.captionName}>Portal cliente</p>
            <p className={styles.captionNote}>Timeline, cards elevadas y acciones rapidas.</p>
          </div>
          <ClientPhone />
        </div>
      </div>
    </div>
  );
}
