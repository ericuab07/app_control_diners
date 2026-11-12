/** Tema de l'app: «auto» segueix el sistema; «light»/«dark» el forcen (atribut data-theme a <html>). */
export type ThemePref = "auto" | "light" | "dark";

/** Clau de localStorage: la preferència és de cada dispositiu. */
export const THEME_KEY = "tema";

export function parseThemePref(value: string | null): ThemePref {
  return value === "light" || value === "dark" ? value : "auto";
}

/**
 * Script en línia per al <head>: aplica el tema desat abans de la primera pintada (sense parpelleig).
 * Només accepta "light" o "dark"; qualsevol altra cosa (o localStorage bloquejat) deixa el mode automàtic.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

type El = { setAttribute(k: string, v: string): void; removeAttribute(k: string): void };
type Storage = { setItem(k: string, v: string): void; removeItem(k: string): void };

/** Aplica i desa la preferència. Si no es pot desar (navegació privada), s'aplica igualment ara. */
export function applyThemePref(pref: ThemePref, el: El, storage: Storage): void {
  if (pref === "auto") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", pref);
  try {
    if (pref === "auto") storage.removeItem(THEME_KEY);
    else storage.setItem(THEME_KEY, pref);
  } catch {
    // sense emmagatzematge: el tema dura fins a tancar la pestanya
  }
}
