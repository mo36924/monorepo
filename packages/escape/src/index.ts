export const attribute = (attribute: string) => attribute.replace(/["&]/g, (m) => (m === '"' ? "&quot;" : "&amp;"));
export const text = (text: string) => text.replace(/[<&]/g, (m) => (m === "<" ? "&lt;" : "&amp;"));
