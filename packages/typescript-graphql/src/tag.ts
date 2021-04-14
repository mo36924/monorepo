type GraphqlTag = "gql" | "useQuery" | "useMutation";

export const isGraphqlTag = (tagName: string): tagName is GraphqlTag => {
  switch (tagName) {
    case "gql":
    case "useQuery":
    case "useMutation":
      return true;
    default:
      return false;
  }
};
