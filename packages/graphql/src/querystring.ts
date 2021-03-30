export const querystring = (args: { query: string; variables?: { [key: string]: any } }) => {
  const params: any = { query: args.query };

  if (args.variables) {
    params.variables = JSON.stringify(args.variables);
  }

  return "" + new URLSearchParams(params);
};
