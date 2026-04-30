import { expect, test, vi } from "vitest";
import { convertResponse } from "../src/zoho-cliq.js";

vi.setConfig({ testTimeout: 1000 });

test("text only response should not change", () => {
  const response = "Simple text";
  const message = convertResponse(response);
  expect(message).toBe(response);
});

test("blockquote response should return blcokquote text", () => {
  const response = `> Bloquote
  > on multiple lines.`;
  const message = convertResponse(response);
  expect(message).toBe("!Bloquote\n!on multiple lines.");
});

test("code block response should return a code text", () => {
  const response = `\`\`\`
  Code block
  on multiple lines.
  \`\`\``;
  const message = convertResponse(response);
  expect(message).toBe("```  Code block\n  on multiple lines.```");
});

test("level 1 heading should return level 1 heading text", () => {
  const response = "# My Heading";
  const message = convertResponse(response);
  expect(message).toBe(response);
});

test("non level 1 heading should return level 3 heading text", () => {
  let response = "# My Heading";
  for (const _ of Array.from({ length: 5 })) {
    response = `#${response}`;
    const message = convertResponse(response);
    expect(message).toBe("### My Heading");
  }
});

test("horizontal line should return and horizontal line with 3 dashes", () => {
  const response = "--------";
  const message = convertResponse(response);
  expect(message).toBe("---");
});

test("html should be returned as-is", () => {
  const response = `
  <div>
    <p>test</p>
  </div>`;
  const message = convertResponse(response);
  expect(message).toBe(response);
});

test("simple list should return a list slide", () => {
  const response = `My list:
  * item 1
  * item 2
  * item 3`;
  const message = convertResponse(response);
  expect(message).toBe(JSON.stringify({
    card: { theme: "modern-inline" as const },
    slides: [
      {
        data: ["item 1", "item 2", "item 3"],
        type: "list",
      },
    ],
    text: "My list:",
  }));
});

test("mutliple paragraphs should return the same text", () => {
  const response = `First paragraph.

  Second paragraph.

  Third paragraph.`;
  const message = convertResponse(response);
  expect(message).toBe(response);
});

test("simple table should return a table item", () => {
  const response = `My table:
  | Header 1 | Header 2 |
  | -------- | -------- |
  | Cell 1   | Cell 2   |
  | Cell 3   | Cell 4   |
  `;
  const message = convertResponse(response);
  expect(message).toBe(JSON.stringify({
    card: { theme: "modern-inline" as const },
    slides: [
      {
        data: {
          headers: ["Header 1", "Header 2"],
          rows: [
            {
              "Header 1": "Cell 1",
              "Header 2": "Cell 2",
            },
            {
              "Header 1": "Cell 3",
              "Header 2": "Cell 4",
            },
          ],
        },
        type: "table",
      },
    ],
    text: "My table:",
  }));
});

test("paragraph after list should be added as text slide", () => {
  const response = `My list:
  * item 1
  * item 2

  The next paragraph.`;
  const message = convertResponse(response);
  expect(message).toBe(JSON.stringify({
    card: { theme: "modern-inline" as const },
    slides: [
      {
        data: ["item 1", "item 2"],
        type: "list",
      },
      {
        data: "  The next paragraph.",
        type: "text",
      },
    ],
    text: "My list:",
  }));
});

test(`br should be returned as \n`, () => {
  const response = `first line\\
  second line`;
  const message = convertResponse(response);
  expect(message).toBe("first line\n  second line");
});

test("codespan should be returned as `", () => {
  const response = "some text `some code`";
  const message = convertResponse(response);
  expect(message).toBe(response);
});

test("del should be returned as ~", () => {
  const response = "~~strikedthrough~~";
  const message = convertResponse(response);
  expect(message).toBe("~strikedthrough~");
});

test("em should be returned as _", () => {
  const response = "_italic_";
  const message = convertResponse(response);
  expect(message).toBe(response);
});

test("inline html should be added as-is", () => {
  const response = 'some html: <span class="myClass">html</span>';
  const message = convertResponse(response);
  expect(message).toBe(response);
});

test("link should return a link without title", () => {
  const response = '[My Link](https://www.test.com/ "Just some test")';
  const message = convertResponse(response);
  expect(message).toBe("[My Link](https://www.test.com/)");
});

test("strong should be returned as *", () => {
  const response = "**strong**";
  const message = convertResponse(response);
  expect(message).toBe("*strong*");
});
