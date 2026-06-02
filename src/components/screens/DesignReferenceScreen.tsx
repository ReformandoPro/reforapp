import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Headphones,
  Home,
  ImageIcon,
  Info,
  MoreVertical,
  Send,
  Share2,
  Trash2,
  User,
} from "lucide-react";

import styles from "./DesignReferenceScreen.module.css";

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
          <ArrowLeft size={20} />
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
            <Info size={14} />
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
              <ClipboardList size={14} />
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
            <Trash2 size={16} color="var(--text-tertiary)" />
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
            <Trash2 size={16} color="var(--text-tertiary)" />
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
            <FileText size={16} />
            PDF
          </button>
          <button className={styles.primaryButton}>
            <Send size={16} />
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
            <Share2 size={18} color="var(--primary-300)" />
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
            <div className={styles.donut} style={{ background: "conic-gradient(var(--primary-300) 0 270deg, rgba(255,255,255,.08) 270deg 360deg)" }}>
              <div className={styles.donutInner}>
                <MoreVertical size={24} color="var(--text-tertiary)" />
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
        ].map(([name, amount, width]) => (
          <div className={styles.categoryCard} key={name}>
            <div className={styles.categoryTop}>
              <div className={styles.categoryName}>{name}</div>
              <div className={styles.categoryAmount}>{amount}</div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width }} />
              </div>
              <span className={styles.percent}>{width} total</span>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.stickyFooter}>
        <button className={styles.primaryButton}>
          <FileText size={16} />
          Exportar Reporte
        </button>
      </div>
    </div>
  );
}

function ClientPhone() {
  return (
    <div className={styles.phone}>
      <div className={styles.phoneBody}>
        <div className={styles.clientHeader}>
          <div className={styles.clientIdentity}>
            <div className={styles.avatar}>
              <User size={28} />
            </div>
            <div>
              <p className={styles.welcome}>Bienvenido de nuevo</p>
              <h2 className={styles.clientName}>Sr. Alejandro Ortiz</h2>
            </div>
          </div>
          <button className={styles.iconButton} aria-label="Soporte">
            <Headphones size={20} color="var(--text-secondary)" />
          </button>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.projectStatusTop}>
            <div>
              <p className={styles.projectLabel}>Estado de su proyecto</p>
              <h3 className={styles.projectName}>Reforma Atico Serrano</h3>
            </div>
            <span className={styles.phasePill}>Fase 3<br />de 5</span>
          </div>
          <div className={styles.progressLabel}>
            <span>Progreso General</span>
            <strong>68%</strong>
          </div>
          <div className={styles.progressBar}>
            <span />
          </div>
          <div className={styles.dateLine}>
            <CalendarDays size={14} />
            Fecha entrega est.: 12 Dic 2024
          </div>
        </div>

        <p className={styles.timelineTitle}>Hitos completados</p>
        <div className={styles.milestone}>
          <div className={styles.marker}>
            <div className={styles.dotDone}><Check size={16} /></div>
          </div>
          <div>
            <p className={styles.milestoneTitle}>Demolicion y Desescombro</p>
            <p className={styles.milestoneCopy}>Finalizado el 15 de Octubre. Zona limpia y preparada para instalaciones.</p>
          </div>
        </div>
        <div className={styles.milestone}>
          <div className={styles.marker}>
            <div className={styles.dotDone}><Check size={16} /></div>
          </div>
          <div>
            <p className={styles.milestoneTitle}>Fontaneria y Electricidad</p>
            <p className={styles.milestoneCopy}>Instalaciones empotradas verificadas segun normativa tecnica.</p>
          </div>
        </div>
        <div className={styles.milestone}>
          <div className={styles.marker}>
            <div className={styles.dotCurrent}><span /></div>
          </div>
          <div>
            <p className={`${styles.milestoneTitle} ${styles.currentMilestone}`}>Revestimientos y Suelos</p>
            <p className={styles.milestoneCopy}>Iniciada la colocacion de tarima natural y alicatados de gran formato.</p>
          </div>
        </div>

        <div className={styles.galleryHead}>
          <p className={styles.timelineTitle}>Galeria de evolucion</p>
          <span className={styles.galleryLink}>Semana 4</span>
        </div>
        <div className={styles.photoGrid}>
          <div className={styles.photo}><span className={styles.photoTag}>Original</span></div>
          <div className={styles.photo}><span className={styles.photoTag}>En curso</span></div>
        </div>
      </div>
      <div className={styles.tabBar}>
        <div className={`${styles.tab} ${styles.activeTab}`}><Home size={20} />Inicio</div>
        <div className={styles.tab}><ImageIcon size={20} />Galeria</div>
        <div className={styles.tab}><FileText size={20} />Docs</div>
        <div className={styles.tab}><Send size={20} />Mensajes</div>
      </div>
    </div>
  );
}

export function DesignReferenceScreen() {
  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <p className={styles.subtitle}>
          Cinco pantallas reconstruidas sobre un sistema unificado. Un unico azul de acento, el verde reservado a dinero
          y validacion, los gremios neutralizados y el rojo limitado a errores. Tema oscuro · Inter + Space Grotesk.
        </p>
      </section>

      <div className={styles.legend}>
        {legend.map((item) => (
          <span className={styles.legendChip} key={item.label}>
            <span className={styles.swatch} style={{ background: item.color }} />
            <b>{item.label}</b>
            <span>· {item.detail}</span>
          </span>
        ))}
      </div>

      <section className={styles.gallery}>
        <div className={styles.screenCell}>
          <div className={styles.caption}>
            <p className={styles.captionType}>Formulario</p>
            <h2 className={styles.captionName}>Nuevo Presupuesto</h2>
            <p className={styles.captionNote}>El CTA paso de verde a azul; las etiquetas de gremio comparten chip neutro.</p>
          </div>
          <BudgetPhone />
        </div>

        <div className={styles.screenCell}>
          <div className={styles.caption}>
            <p className={styles.captionType}>Dashboard analitico</p>
            <h2 className={styles.captionName}>Rentabilidad</h2>
            <p className={styles.captionNote}>Las barras por categoria son azules; el verde queda solo en beneficio.</p>
          </div>
          <ProfitPhone />
        </div>

        <div className={styles.screenCell}>
          <div className={styles.caption}>
            <p className={styles.captionType}>Portal cliente</p>
            <h2 className={styles.captionName}>Bienvenida / Estado</h2>
            <p className={styles.captionNote}>Timeline con verde para hito completado y azul para el curso activo.</p>
          </div>
          <ClientPhone />
        </div>
      </section>
    </main>
  );
}
