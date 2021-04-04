declare module "*.gql" {
  import type { DocumentNode } from "graphql";
  const documentNode: DocumentNode;
  export default documentNode;
}
declare module "*.graphql" {
  import type { DocumentNode } from "graphql";
  const documentNode: DocumentNode;
  export default documentNode;
}
