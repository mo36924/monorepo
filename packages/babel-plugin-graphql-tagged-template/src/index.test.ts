import { transformAsync, TransformOptions } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import { buildSchema } from "graphql";
import plugin, { Options } from "./index";

const schema = buildSchema(`
type Query {
  user(offset: Int): User
}
type Mutation {
  create(name: String): User
}
type User {
  name: String
}
`);

const options: TransformOptions = {
  babelrc: false,
  configFile: false,
  plugins: [[plugin, { schema } as Options]],
};

const transform = (code: string) => transformAsync(code, options);

describe("babel-plugin-graphql-tagged-template", () => {
  test("gql query", async () => {
    const result = await transform(`
      const params = gql\`{
        user(offset: 2) {
          name
        }
      }\`
    `);

    expect(result).toMatchInlineSnapshot(`
      const params = {
        query: "{user(offset:2){name}}",
      };
    `);
  });

  test("gql mutation", async () => {
    const result = await transform(`
      const params = gql\`mutation($name: String!){
        create(name: $name) {
          name
        }
      }\`
    `);

    expect(result).toMatchInlineSnapshot(`
      const params = {
        query: "mutation($name:String!){create(name:$name){name}}",
      };
    `);
  });

  test("useQuery", async () => {
    const result = await transform(`
      const offset = 2
      useQuery\`
        user(offset: \${offset}) {
          name
        }
      \`
    `);

    expect(result).toMatchInlineSnapshot(`
      const offset = 2;
      useQuery({
        query: "query($_0:Int){user(offset:$_0){name}}",
        variables: {
          _0: offset,
        },
      });
    `);
  });

  test("useMutation", async () => {
    const result = await transform(`
      const name = "hoge";
      useMutation\`
        create(name: \${name}) {
          name
        }
      \`
    `);

    expect(result).toMatchInlineSnapshot(`
      const name = "hoge";
      useMutation({
        query: "mutation($_0:String){create(name:$_0){name}}",
        variables: {
          _0: name,
        },
      });
    `);
  });
});
