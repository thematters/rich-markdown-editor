// import _debounce from 'lodash/debounce';

import React, { FC, useMemo, useCallback } from 'react';

import './all.css';

// import { CoreStyledComponent, coreStyledCss } from '@remirror/styles/emotion';

import { css } from '@emotion/css';
import jsx from 'refractor/lang/jsx';
import typescript from 'refractor/lang/typescript';
import { ExtensionPriority, StateUpdateLifecycleParameter, getThemeVar } from 'remirror';
import {
  BlockquoteExtension,
  BoldExtension,
  BulletListExtension,
  CodeBlockExtension,
  CodeExtension,
  DropCursorExtension,
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
  useHelpers,
  useRemirror,
} from '@remirror/react';
// import { AllStyledComponent } from '@remirror/styles/emotion';

import { wrappingInputRule } from '@remirror/pm/inputrules';
import type { PasteRule } from '@remirror/pm/paste-rules';

import { ProsemirrorDevTools } from '@remirror/dev';

// import data from 'svgmoji/emoji.json';

import { FloatingLinkToolbar } from './link-toolbar';

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

        { type: ComponentItem.ToolbarButton, icon: 'linkM', onClick() {
          console.log('linkM onClick:');
        } },
        { type: ComponentItem.ToolbarButton, icon: 'imageLine', onClick() {
          console.log('imageLine onClick:');
        } },

      ],
      // separator: 'end',
    },
  ];

  return <Toolbar items={toolbarItems} refocusEditor label="Top Toolbar" />;
}

class FigcaptionExtension extends ImageExtension {
  createNodeSpec(extra: ApplySchemaAttributes, override: NodeSpecOverride): NodeExtensionSpec {
    const spec = super.createNodeSpec(extra, override);

    return {
      ...spec,
      attrs: {
        ...spec.attrs,
        figcaptionText: { default: spec.attrs.alt || '' },
      },
      toDOM: (node) => [
        'figure',
        {
          style: 'border: 1px solid #479e0c; padding: 8px; margin: 8px; text-align: center;',
        },
        spec.toDOM!(node),
        [
          'figcaption',
          // { style: 'background-color: #3d3d3d; color: #f1f1f1; padding: 8px;' },
          node.attrs.figcaptionText || spec.attrs.alt,
        ],
      ],
    };
  }

  createInputRules(): InputRule[] {
    return [wrappingInputRule(/^\s*>\s$/, this.type)];
  }

  createPasteRules(): PasteRule {
    return {
      type: 'node',
      nodeType: this.type,
      regexp: /^\s*\!\[.*\]\(https?:\/\/.*\)\s$/,
      startOfTextBlock: true,
    };
  }
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

  const markdownExtension = useMemo(() => {
    const extension = new MarkdownExtension({ copyAsMarkdown: false });
    return extension;
  }, []);

  const extensions = useCallback(
    () => [
      new PlaceholderExtension({ placeholder }),

      // new LinkExtension(),
      linkExtension,

      /* new EmojiExtension({
        // data,
        plainText: true,
        // moji: 'noto'
      }), */
      // new LinkExtension({ autoLink: true }),
      new BoldExtension(),
      new StrikeExtension(),

      // new ImageExtension(),
      new FigcaptionExtension(),
      new DropCursorExtension(),

      new ItalicExtension(),
      new HeadingExtension(),
      new HorizontalRuleExtension(),

      new BlockquoteExtension(),
      new BulletListExtension({ enableSpine: true }),
      new OrderedListExtension(),
      new ListItemExtension({ priority: ExtensionPriority.High, enableCollapsible: true }),
      new CodeExtension(),
      new CodeBlockExtension({ supportedLanguages: [jsx, typescript] }),
      new TrailingNodeExtension(),

      // new TableExtension(),

      markdownExtension,
      // MarkdownExtension = new MarkdownExtension({ copyAsMarkdown: false }),

      /**
       * `HardBreakExtension` allows us to create a newline inside paragraphs.
       * e.g. in a list item
       */
      new HardBreakExtension(),
    ],
    [placeholder]
  );

  const { manager, state, setState, onChange: originalOnChange } = useRemirror({
    extensions,
    stringHandler: 'markdown',
    content: initialContent,
  });

  // const { getMarkdown } = useHelpers(true);

  const changeHandler: typeof originalOnChange = (parameter: StateUpdateLifecycleParameter) => {
    if (parameter.tr?.docChanged) {
      console.log('before onChange:', parameter);
      editorUpdate?.(markdownExtension.getMarkdown());	// manager.store.helpers.getMarkdown(),
    }

    // Update the state to the latest value.
    setState(parameter.state);
    // return originalOnChange(parameter)
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
          <FloatingLinkToolbar />
          {/* <EmojiPopupComponent /> */}
          {children}
          <ProsemirrorDevTools />
        </Remirror>
      </ThemeProvider>
    // </AllStyledComponent>
  );
};