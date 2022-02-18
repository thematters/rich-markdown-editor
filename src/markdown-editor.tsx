// import _debounce from 'lodash/debounce';

import React, { FC, useMemo, useCallback } from 'react';

import './all.css';

// import { CoreStyledComponent, coreStyledCss } from '@remirror/styles/emotion';

import { css } from '@emotion/css';
import jsx from 'refractor/lang/jsx';
import typescript from 'refractor/lang/typescript';
import { ExtensionPriority, getThemeVar } from 'remirror';
import {
  BlockquoteExtension,
  BoldExtension,
  BulletListExtension,
  CodeBlockExtension,
  CodeExtension,
  EmojiExtension,
  HardBreakExtension,
  HeadingExtension,
  HorizontalRuleExtension,
  ImageExtension,
  ItalicExtension,
  LinkExtension,
  ListItemExtension,
  MarkdownExtension,
  OrderedListExtension,
  PlaceholderExtension,
  StrikeExtension,
  // TableExtension,
  TrailingNodeExtension,
} from 'remirror/extensions';
import {
  ComponentItem,
  EditorComponent,
  EmojiPopupComponent,
  Remirror,
  ThemeProvider,
  Toolbar,
  ToolbarItemUnion,
  useChainedCommands,
  useCommands,
  useRemirror,
} from '@remirror/react';
import { AllStyledComponent } from '@remirror/styles/emotion';

import data from 'svgmoji/emoji.json';

// import { FloatingLinkToolbar } from './link-toolbar';

export default { title: 'Editors / Markdown' };

export interface MarkdownEditorProps {
  placeholder?: string;
  initialContent?: string;
  editorUpdate?: (params: Params) => void;

  editorContent?: string;
  editorContentId?: string;
  editorUpload?: (params: Params) => Promise<ResultData>;
  enableReviseMode?: boolean;
  enableSummary?: boolean;
  enableToolbar?: boolean;
  eventName?: string;
  language?: Language;
}

const Menubar = () => {
  const chain = useChainedCommands();

  const toolbarItems: ToolbarItemUnion[] = [
    {
      type: ComponentItem.ToolbarGroup,
      label: 'Heading Formatting',
      items: [
        {
          type: ComponentItem.ToolbarCommandButton,
          commandName: 'toggleHeading',
          display: 'icon',
          attrs: { level: 2 },
        },
        {
          type: ComponentItem.ToolbarCommandButton,
          commandName: 'toggleHeading',
          display: 'icon',
          attrs: { level: 3 },
        },
        {
          type: ComponentItem.ToolbarCommandButton,
          commandName: 'toggleHeading',
          display: 'icon',
          attrs: { level: 4 },
        },
        { type: ComponentItem.ToolbarCommandButton, commandName: 'toggleBold', display: 'icon' },
        { type: ComponentItem.ToolbarCommandButton, commandName: 'toggleItalic', display: 'icon' },
        { type: ComponentItem.ToolbarCommandButton, commandName: 'toggleStrike', display: 'icon' },

        {
          type: ComponentItem.ToolbarCommandButton,
          commandName: 'toggleBlockquote',
          display: 'icon',
        },
        {
          type: ComponentItem.ToolbarCommandButton,
          commandName: 'toggleBulletList',
          display: 'icon',
        },
        {
          type: ComponentItem.ToolbarCommandButton,
          commandName: 'toggleOrderedList',
          display: 'icon',
        },
        { type: ComponentItem.ToolbarCommandButton, commandName: 'toggleCodeBlock', display: 'icon' },
        { type: ComponentItem.ToolbarButton, label: '--', onClick() {
          chain // Begin a chain
            .insertHorizontalRule()
            .focus()
            .run(); // A chain must always be terminated with `.run()`
        } },

      ],
      // separator: 'end',
    },
  ];

  return <Toolbar items={toolbarItems} refocusEditor label="Top Toolbar" />;
}

/**
 * The editor which is used to create the annotation. Supports formatting.
 */
export const MarkdownEditor: FC<MarkdownEditorProps> = ({
  placeholder,
  initialContent,
  editorUpdate,
  children,
}) => {

  const linkExtension = useMemo(() => {
    const extension = new LinkExtension({ autoLink: true });
    extension.addHandler('onClick', (_, data) => {
      console.log(`You clicked link: ${JSON.stringify(data)}`);
      return true;
    });
    return extension;
  }, []);

  const extensions = useCallback(
    () => [
      new PlaceholderExtension({ placeholder }),
      new EmojiExtension({
        data,
        plainText: true,
        // moji: 'noto'
      }),
      // new LinkExtension({ autoLink: true }),
      new BoldExtension(),
      new StrikeExtension(),
      new ImageExtension(),
      new ItalicExtension(),
      new HeadingExtension(),
      new HorizontalRuleExtension(),

      // new LinkExtension(),
      linkExtension,
      new BlockquoteExtension(),
      new BulletListExtension({ enableSpine: true }),
      new OrderedListExtension(),
      new ListItemExtension({ priority: ExtensionPriority.High, enableCollapsible: true }),
      new CodeExtension(),
      new CodeBlockExtension({ supportedLanguages: [jsx, typescript] }),
      new TrailingNodeExtension(),

      // new TableExtension(),

      new MarkdownExtension({ copyAsMarkdown: false }),
      /**
       * `HardBreakExtension` allows us to create a newline inside paragraphs.
       * e.g. in a list item
       */
      new HardBreakExtension(),
    ],
    [placeholder]
  );

  const { manager, state, setState } = useRemirror({
    extensions,
    stringHandler: 'markdown',
    content: initialContent,
  });

  const changeHandler = (parameter) => {
    // Update the state to the latest value.
    if (parameter.tr?.docChanged) {
      console.log('before onChange:', parameter);
      editorUpdate?.(parameter);
    }
    setState(parameter.state);
  };

  return (
    // <AllStyledComponent>
      <ThemeProvider>
        <Remirror manager={manager} autoFocus state={state} onChange={changeHandler}
          classNames={[
            css`
              &.ProseMirror {
                padding: 0;
                pre {
                  height: 100%;
                  padding: ${getThemeVar('space', 3)};
                  margin: 0;
                }
              }
            `,
          ]}
        >
          <Menubar />
          <EditorComponent />
          {/* <FloatingLinkToolbar /> */}
          {/* <EmojiPopupComponent /> */}
          {children}
        </Remirror>
      </ThemeProvider>
    // </AllStyledComponent>
  );
};