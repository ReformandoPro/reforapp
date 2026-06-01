/** ============================================================
 *  Sistema de Diseño — App Gestión de Reformas
 *  tailwind.config.js · Tema base dark mode
 *
 *  Uso: clases como bg-surface, text-primary, bg-primary-500,
 *  rounded-md, text-success-300, etc.
 *  ============================================================ */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // la app es dark por defecto; aplica .dark en <html>
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue,svelte}",
  ],
  theme: {
    // Reemplazamos la paleta por defecto para evitar colores fuera del sistema.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      // Superficies
      bg: {
        base:    "#0A0F1A",
        surface: "#0E1626",
        raised:  "#162132",
        overlay: "#1C2940",
      },

      // Texto (usar como text-content-*)
      content: {
        primary:   "#F4F7FC",
        secondary: "#A8B2C4",
        tertiary:  "#6B7689",
        disabled:  "#4A5366",
      },

      // Primario
      primary: {
        50:  "#E8F1FE",
        100: "#C7DEFD",
        300: "#6FA8F6",
        500: "#2D7FF9",
        600: "#1E66D6",
        700: "#1850AB",
        900: "#0C2F6B",
        DEFAULT: "#2D7FF9",
      },

      // Éxito / dinero
      success: {
        100: "#9FE1CB",
        300: "#5DCAA5",
        500: "#1D9E75",
        700: "#0F6E56",
        900: "#04342C",
        DEFAULT: "#1D9E75",
      },

      // Aviso / pendiente
      warning: {
        100: "#FAC775",
        500: "#EF9F27",
        700: "#854F0B",
        900: "#412402",
        DEFAULT: "#EF9F27",
      },

      // Error / destructivo (SOLO error y eliminar)
      danger: {
        100: "#F09595",
        500: "#E24B4A",
        700: "#A32D2D",
        900: "#501313",
        DEFAULT: "#E24B4A",
      },

      // Gremios: neutro, sin color propio
      guild: {
        bg:     "rgba(136,135,128,0.18)",
        text:   "#C9CDD6",
        border: "rgba(136,135,128,0.28)",
      },
    },

    borderRadius: {
      none: "0",
      sm:   "8px",
      md:   "12px", // botones, inputs
      lg:   "16px", // tarjetas
      xl:   "20px", // hojas modales
      full: "9999px",
    },

    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        num:  ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },

      // Escala tipográfica: [size, { lineHeight, fontWeight }]
      fontSize: {
        display:  ["34px", { lineHeight: "40px", fontWeight: "700" }],
        h1:       ["28px", { lineHeight: "34px", fontWeight: "700" }],
        h2:       ["22px", { lineHeight: "28px", fontWeight: "700" }],
        h3:       ["18px", { lineHeight: "24px", fontWeight: "600" }],
        body:     ["16px", { lineHeight: "24px", fontWeight: "400" }],
        label:    ["14px", { lineHeight: "20px", fontWeight: "500" }],
        caption:  ["13px", { lineHeight: "18px", fontWeight: "400" }],
        overline: ["12px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.06em" }],
        "num-md": ["18px", { lineHeight: "24px", fontWeight: "600" }],
      },

      spacing: {
        // base 4px ya cubierta por Tailwind (1=4px). Aliases semánticos:
        card:    "20px",
        section: "24px",
        screen:  "32px",
      },

      boxShadow: {
        fab:   "0 8px 24px rgba(45,127,249,0.35)",
        sheet: "0 -8px 32px rgba(0,0,0,0.45)",
        focus: "0 0 0 3px rgba(45,127,249,0.45)",
      },

      borderColor: {
        subtle:  "rgba(255,255,255,0.06)",
        DEFAULT: "rgba(255,255,255,0.10)",
        strong:  "rgba(255,255,255,0.16)",
      },

      ringColor: {
        focus: "rgba(45,127,249,0.45)",
      },
    },
  },
  plugins: [],
};
