import type { ShowcaseProject } from "../types";

export const showcaseProjects: ShowcaseProject[] = [
  {
    slug: "obra-centro",
    title: "Reforma integral en Madrid Centro",
    subtitle: "Vivienda de 92 m² · Reforma completa",
    location: "Madrid Centro",
    status: {
      label: "En ejecución",
      tone: "success",
    },
    hero: {
      eyebrow: "Proyecto destacado",
      headline: "Controla cada fase de la reforma desde una sola pantalla",
      description:
        "Presupuesto, gremios, tareas, costes y progreso conectados en una vista clara para el reformista y su cliente.",
      ctaLabel: "Ver seguimiento",
    },
    metrics: [
      {
        label: "Progreso",
        value: "68%",
        helper: "Fase de instalaciones",
        tone: "primary",
      },
      {
        label: "Presupuesto",
        value: "42.800 €",
        helper: "Estimación aprobada",
        tone: "neutral",
      },
      {
        label: "Desviación",
        value: "+3,4%",
        helper: "Dentro del margen previsto",
        tone: "warning",
      },
    ],
    progress: {
      label: "Avance general",
      value: 68,
      helper: "Instalaciones completadas parcialmente",
    },
    budget: {
      estimated: "42.800 €",
      spent: "29.450 €",
      remaining: "13.350 €",
      deviationLabel: "+3,4%",
      deviationTone: "warning",
    },
    guilds: [
      {
        name: "Albañilería",
        statusLabel: "Completado",
        tone: "success",
      },
      {
        name: "Electricidad",
        statusLabel: "En curso",
        tone: "primary",
      },
      {
        name: "Fontanería",
        statusLabel: "Pendiente revisión",
        tone: "warning",
      },
    ],
    timeline: [
      {
        title: "Demoliciones",
        date: "Semana 1",
        description: "Retirada de tabiquería y preparación de obra.",
        status: "done",
      },
      {
        title: "Instalaciones",
        date: "Semana 3",
        description: "Electricidad y fontanería en ejecución.",
        status: "current",
      },
      {
        title: "Acabados",
        date: "Semana 5",
        description: "Pavimentos, pintura y remates finales.",
        status: "pending",
      },
    ],
    highlights: [
      {
        title: "Visibilidad para el cliente",
        description:
          "El cliente entiende el estado de la obra sin llamadas ni mensajes constantes.",
      },
      {
        title: "Control económico",
        description:
          "Cada desviación queda vinculada a partidas, gremios y decisiones.",
      },
    ],
  },
];

