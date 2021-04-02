export default (base64: string) => base64.replace(/[\+\/=]/g, (m) => (m === "+" ? "-" : m === "/" ? "_" : ""));
