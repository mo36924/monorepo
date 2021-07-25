/** @jsxImportSource . */
import { describe, expect, test } from "@jest/globals";
import { render } from "./index";

describe("jsx-template", () => {
  test("tag", async () => {
    const html = await render(<div></div>);
    expect(html).toMatchInlineSnapshot(`"<div></div>"`);
  });

  test("component", async () => {
    const Component = (props: { id: string }) => <div id={props.id}></div>;
    const html = await render(<Component id="component"></Component>);
    expect(html).toMatchInlineSnapshot(`"<div id=\\"component\\"></div>"`);
  });

  test("async component", async () => {
    const AsyncComponent = async (props: { id: string }) => {
      await Promise.resolve();
      return <div id={props.id}></div>;
    };

    const html = await render(<AsyncComponent id="component"></AsyncComponent>);
    expect(html).toMatchInlineSnapshot(`"<div id=\\"component\\"></div>"`);
  });
});
