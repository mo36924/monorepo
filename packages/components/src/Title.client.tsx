export const Title = (props: { children?: string }) => {
  document.title = props.children || "";
  return null;
};
