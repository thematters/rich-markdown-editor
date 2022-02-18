import React from 'react';
import { render } from 'react-dom';

import { css } from '@emotion/css';
import { useHelpers } from '@remirror/react';

import { MarkdownEditor } from '../src';

const basicContent = `
**Markdown** content is the _best_
<br>

## Heading 2
<br>

### Heading 3
<br>

#### Heading 4
<br>

> Blockquote

[matters link](https://matters.news)

![image caption](https://myoctocat.com/assets/images/base-octocat.svg)

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
    <MarkdownEditor
      placeholder="Start typing..."
      initialContent={basicContent}
      editorUpdate={(params: Params) => console.log('editorUpdate:', JSON.stringify(params))}
    >
      <MarkdownPreview />
    </MarkdownEditor>
  );
};

render(<App />, document.getElementById('demo'));
