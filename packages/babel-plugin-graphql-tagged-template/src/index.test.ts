import { TransformOptions, transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import { buildSchema } from "graphql";
import plugin, { Options } from "./index";

const schema = buildSchema(`
  scalar Unknown
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

const transform = (code: string) => transformSync(code, options);

describe("babel-plugin-graphql-tagged-template", () => {
  test("gql query", () => {
    const result = transform(`
      const params = gql\`{
        user(offset: 2) {
          name
        }
      }\`
    `);

    expect(result).toMatchInlineSnapshot(`
      const params = gql({
        query: "{user(offset:2){name}}",
      });
    `);
  });

  test("gql mutation", () => {
    const result = transform(`
      const params = gql\`mutation($name: String!){
        create(name: $name) {
          name
        }
      }\`
    `);

    expect(result).toMatchInlineSnapshot(`
      const params = gql({
        query: "mutation($name:String!){create(name:$name){name}}",
      });
    `);
  });

  test("query", () => {
    const result = transform(`
      const offset = 2
      query\` 
        {
          user(offset: \${offset}) {
            name
          }
        }
      \`
    `);

    expect(result).toMatchInlineSnapshot(`
      const offset = 2;
      query({
        query: "query($_0:Int){user(offset:$_0){name}}",
        variables: {
          _0: offset,
        },
      });
    `);
  });

  test("mutation", () => {
    const result = transform(`
      const name = "hoge";
      mutation\`
        {
          create(name: \${name}) {
            name
          }
        }
      \`
    `);

    expect(result).toMatchInlineSnapshot(`
      const name = "hoge";
      mutation({
        query: "mutation($_0:String){create(name:$_0){name}}",
        variables: {
          _0: name,
        },
      });
    `);
  });
});
