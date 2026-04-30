import { Marked, type MarkedToken, type Token, type Tokens } from "marked";

export function getOutputFormattingPrompt(): string {
  return `Your response will be output in a Zoho Cliq chat.
  # How to format the response
  The text response should be formatted in Markdown format.
  Use only 2 depths of heading: # and ###.`;
}

interface ListSlide {
  data: string[];
  title?: string | undefined;
  type: "list";
}

interface TableData {
  headers: string[];
  rows: Record<string, string>[];
}

interface TableSlide {
  data: TableData;
  title?: string | undefined;
  type: "table";
}

interface TextSlide {
  data: string;
  title?: string | undefined;
  type: "text";
}

type Slide = ListSlide | TableSlide | TextSlide;

interface Message {
  card: { theme: "modern-inline" };
  slides: Slide[];
  text: string;
}

function appendText(message: Message, text: string): void {
  const slidesCount = message.slides.length;

  if (slidesCount === 0) {
    message.text += text;

    return;
  }

  const slide = message.slides[slidesCount - 1];

  if (slide && slide.type === "text") {
    slide.data += text;
  }
}

function parseInlineToken(token: MarkedToken): string {
  switch (token.type) {
    case "br":
    case "escape": {
      return "\n";
    }
    case "codespan": {
      return `\`${token.text}\``;
    }
    case "del": {
      return `~${parseInline(token.tokens)}~`;
    }
    case "em": {
      return `_${parseInline(token.tokens)}_`;
    }
    case "html": {
      return token.text;
    }
    case "link": {
      return `[${parseInline(token.tokens)}](${token.href})`;
    }
    case "strong": {
      return `*${parseInline(token.tokens)}*`;
    }
    case "text": {
      return token.text;
    }
    default: {
      return "";
    }
  }
}

function parseInline(tokens: Token[]): string {
  let out = "";

  for (const token of tokens) {
    out += parseInlineToken(token as MarkedToken);
  }

  return out;
}

function parseBlockquote({ tokens }: Tokens.Blockquote, message: Message): void {
  const innerMessage = parse(tokens);
  const blockquoteText = innerMessage.text.replace(/^/gm, "!");
  appendText(message, blockquoteText);
}

function parseHeading({ tokens, depth }: Tokens.Heading, message: Message): void {
  let text = parseInline(tokens);

  text = depth === 1 ? `# ${text}` : `### ${text}`;

  appendText(message, text);
}

function parseList({ items }: Tokens.List, message: Message): void {
  const listSlide: ListSlide = {
    data: [],
    type: "list",
  };

  for (const item of items) {
    if (item) {
      const innerMessage = parse(item.tokens);
      listSlide.data.push(innerMessage.text);
    }
  }

  message.slides.push(listSlide);
}

function parseParagraph({ tokens }: Tokens.Paragraph, message: Message): void {
  const text = parseInline(tokens);
  if (message.slides.length > 0) {
    message.slides.push({
      data: text,
      type: "text",
    });
  } else {
    message.text += text;
  }
}

function parseRow(row: Tokens.TableCell[], headers: string[]): Record<string, string> {
  const rowData: Record<string, string> = {};

  for (let column = 0; column < row.length; column += 1) {
    const cell = row[column];
    const headerData = headers[column];
    if (cell && headerData) {
      rowData[headerData] = parseInline(cell.tokens);
    }
  }

  return rowData;
}

function parseTable({ header, rows }: Tokens.Table, message: Message): void {
  const tableData: TableData = {
    headers: [],
    rows: [],
  };

  message.slides.push({
    data: tableData,
    type: "table",
  });

  for (const hr of header) {
    if (hr) {
      tableData.headers.push(parseInline(hr.tokens));
    }
  }

  for (const row of rows) {
    if (row) {
      const rowData = parseRow(row, tableData.headers);
      tableData.rows.push(rowData);
    }
  }
}

/* eslint-disable @typescript-eslint/max-statements */
function parseToken(token: MarkedToken, message: Message): void {
  switch (token.type) {
    case "blockquote": {
      parseBlockquote(token, message);
      break;
    }
    case "code": {
      appendText(message, `\`\`\`${token.text}\`\`\``);
      break;
    }
    case "heading": {
      parseHeading(token, message);
      break;
    }
    case "hr": {
      appendText(message, "---");
      break;
    }
    case "html": {
      appendText(message, token.text);
      break;
    }
    case "list": {
      parseList(token, message);
      break;
    }
    case "paragraph": {
      parseParagraph(token, message);
      break;
    }
    case "space": {
      appendText(message, token.raw);
      break;
    }
    case "table": {
      parseTable(token, message);
      break;
    }
    case "text": {
      if (token.tokens) {
        appendText(message, parseInline(token.tokens));
      }
      break;
    }
    default: {
      break;
    }
  }
}
/* eslint-enable @typescript-eslint/max-statements */

function parse(tokens: Token[]): Message {
  const slides: Slide[] = [];

  const message = {
    card: { theme: "modern-inline" as const },
    slides,
    text: "",
  };

  for (const anyToken of tokens) {
    const token = anyToken as MarkedToken;
    parseToken(token, message);
  }

  return message;
}

export function convertResponse(response: string): string {
  const marked = new Marked();

  const tokens = marked.lexer(response);

  const message = parse(tokens);

  if (message.slides.length === 0) {
    return message.text;
  }

  return JSON.stringify(message);
}
