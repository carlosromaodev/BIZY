export const CLASSE_CAMPO_ESCURO = [
  "min-h-11 !rounded-2xl !border-white/16 !bg-transparent !text-white !shadow-none !backdrop-blur-none",
  "placeholder:!text-white/42 hover:!border-white/28",
  "focus:!border-[#d8ff72] focus:!bg-transparent focus:!ring-2 focus:!ring-[#d8ff72]/25",
  "focus-visible:!border-[#d8ff72] focus-visible:!bg-transparent focus-visible:!ring-2 focus-visible:!ring-[#d8ff72]/25",
  "disabled:!bg-white/5 disabled:!text-white/45"
].join(" ");

export const CLASSE_TEXTAREA_ESCURO = `${CLASSE_CAMPO_ESCURO} min-h-28 py-3`;

export const CLASSE_BOTAO_CONTORNO_ESCURO = [
  "!border-white/16 !bg-transparent !text-white/82 !shadow-none",
  "hover:!border-white/28 hover:!bg-white/8 hover:!text-white",
  "focus-visible:!border-[#d8ff72] focus-visible:!ring-2 focus-visible:!ring-[#d8ff72]/25",
  "active:!border-[#d8ff72] disabled:!bg-transparent disabled:!text-white/36"
].join(" ");
