export const exists = (id?: string) => id && document.getElementById(id);
export const getHref = (url?: string) => url && new URL(url, location.href).href;
