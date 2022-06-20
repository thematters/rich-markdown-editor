import React from 'react';
import { render } from 'react-dom';

import { css } from '@emotion/css';
import { useHelpers } from '@remirror/react';

import { MarkdownEditorCrust } from '../src/markdown-editor-crust';

const basicContent = `
**Markdown** content is the _best_
<br>

# Heading 1
<br>

## Heading 2
<br>

### Heading 3
<br>

#### Heading 4
<br>

##### Heading 5
<br>

###### Heading 6
<br>

> Blockquote

\`\`\`ts
const a = 'asdf';
\`\`\`

playtime is just beginning

## List support

- an unordered
  - list is a thing
    - of beauty
1. As is
2. An ordered
3. List
`;

function MarkdownPreview() {
  const { getMarkdown } = useHelpers(true);

  return (<div
    className={css`
      margin: 0.25rem;
      padding: 0.25rem;
      border: 0.25rem solid hotpink;
      border-radius: 0.5rem;
      &:hover {
        border-color: blue;
      }
    `}
  >
    <pre>
      <code>{getMarkdown()}</code>
    </pre>
  </div>);
}

const App = () => {
  return (
    <MarkdownEditorCrust
      placeholder="Start typing..."
      initialContent={basicContent}
      editorUpdate={(params: Params) => console.log('editorUpdate:', params)}
    >
    <MarkdownPreview />
    </MarkdownEditorCrust>
  );
};

render(<App />, document.getElementById('demo'));
