// import _debounce from 'lodash/debounce';

import React, { FC, useMemo, useState, useRef, useEffect, useCallback } from 'react';

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
  Button,
  Input,
  ComponentItem,
  EditorComponent,
  EmojiPopupComponent,
  Remirror,
  ThemeProvider,
  Toolbar,
  ToolbarItemUnion,
  ControlledDialogComponent,
  useChainedCommands,
  useCommands,
  useRemirror,
  useRemirrorContext,
} from '@remirror/react';
import { AllStyledComponent } from '@remirror/styles/emotion';
import axios from 'axios';

import data from 'svgmoji/emoji.json';


import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";


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

const ipfsPinningService = 'https://pin.crustcode.com/psa';
const endpoint = 'https://gw.crustapps.net';
const endpointIPFS = 'https://ipfs.io/ipfs';
const fileMap = new Map();

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
export const MarkdownEditorCrust: FC<MarkdownEditorProps> = ({
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

  const authHeaderRef = useRef();
  const [MDCid, setMDCid] = useState('');
  const [MDText, setMDText] = useState(initialContent);
  const [showWarning, setShowWarning] = useState(false);
  const [warningInfo, setWarningInfo] = useState('');

  const pinMarkdonw = async () => {
    const form = new FormData();
    form.append('file', MDText);
    setMDCid('Saving...');
    const upResult = await pin2Gateway(form);
    if (upResult === null) {
      setWarningInfo('Cannot save markdown file because of invalid signature. Please make sure your metamask has connected to Ploygon.');
      setShowWarning(true);
      setMDCid('Save markdown failed.');
      return;
    }
    const cid = upResult.data.Hash;
    setMDCid(cid);
    await pin(cid);
  };

  const pin = async (cid: string) => {
    //if (cid.length !== 46) {
    if (cid.length === 0) {
      throw new Error('CID len err');
    }
    //const { body } = await axios.post(
    const res = await axios.post(
      `${ipfsPinningService}/pins`,
      JSON.stringify({
        cid: cid,
        name: 'thematters.md'
      }),
      {
        headers: {
          authorization: 'Bearer ' + authHeaderRef.current,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(res)
  }

  const getAuth = async () => {
    const provider = await detectEthereumProvider();
    if (provider && provider.isMetaMask) {
      const chainId = await provider.request({
        method: "eth_chainId",
      });

      if (parseInt(chainId, 16) === 137) {
        await provider.request({ method: "eth_requestAccounts" });
        const providerPolygon = new ethers.providers.Web3Provider(provider);
        const signer = providerPolygon.getSigner();
        const addr = await signer.getAddress();
        const signature = await signer.signMessage(addr);
        return Buffer.from(`pol-${addr}:${signature}`).toString("base64");
      }
      return '';
    }
  };

  const pin2Gateway = async (form: FormData) => {
    if (!authHeaderRef.current || authHeaderRef.current === '') {
      authHeaderRef.current = await getAuth();
    }
    if (authHeaderRef.current === '') {
      setShowWarning(true);
      setWarningInfo('Cannot load file because of invalid signature. Please make sure your metamask has connected to Ploygon.');
      return null;
    }

    try {
      const cancel = axios.CancelToken.source();
      const upResult = await axios.request({
        method: 'post',
        url: `${endpoint}/api/v0/add`,
        params: {
          pin: true
        },
        headers: {
          Authorization: `Basic ${authHeaderRef.current}`,
        },
        data: form,
        cancelToken: cancel.token,
      });
      console.log(upResult);
      return upResult;
    } catch (e: any) {
      console.error(e.message);
    }
    return null;
  };

  const uploadHandler = (files: FileWithProgress[]): DelayedImage[] => {
    //invariant(files.length > 0, {
    //  code: ErrorConstant.EXTENSION,
    //  message: 'The upload handler was applied for the image extension without any valid files',
    //});

    let completed = 0;
    const promises: Array<DelayedPromiseCreator<ImageAttributes>> = [];
  
    for (const { file, progress } of files) {
      promises.push(
        () =>
          new Promise<ImageAttributes>((resolve, reject) => {
            const reader = new FileReader();
  
            reader.addEventListener(
              'load',
              async (readerEvent) => {
                console.log(file);
                completed += 1;
                progress(completed / files.length);
                // Upload data to IPFS gateway
                //let imgSrc = readerEvent.target?.result as string;
                let imgCid = fileMap.get(file.name);
                if (!fileMap.has(file.name)) {
                  const form = new FormData();
                  form.append("file", file, file.name);
                  const upResult = await pin2Gateway(form);
                  if (upResult !== null) {
                    imgCid = upResult.data.Hash;
                    fileMap.set(file.name, upResult.data.Hash);
                  }
                }
                imgCid ? resolve({ src: `${endpoint}/ipfs/${imgCid}`, fileName: file.name }) : reject();
              },
              { once: true },
            );
  
            reader.readAsDataURL(file);
          }),
      );
    };

    return promises;
  }

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
      new ImageExtension({ uploadHandler: uploadHandler, enableResizing: true }),
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

  const [orgCid, setOrgCid] = useState('');
  const [nMarkdown, setNMarkdown] = useState('');
  const [loadPrg, setLoadPrg] = useState(-1);

  const changeHandler = (parameter) => {
    // Update the state to the latest value.
    if (parameter.tr?.docChanged) {
      console.log('before onChange:', parameter);
      editorUpdate?.(parameter);
    }
    setState(parameter.state);
    setMDText(parameter.helpers.getMarkdown());
  };

  const orgCidChange = (e) => {
    setOrgCid(e.target.value);
  };

  const loadMarkdown = async () => {
    setLoadPrg(0);
    const upResult = await axios.request({
      method: 'get',
      url: `${endpoint}/ipfs/${orgCid}`,
      onUploadProgress: (p) => {
        const percent = p.loaded / p.total * 100;
        setLoadPrg(percent);
      }
    });
    setLoadPrg(100);
    setNMarkdown(upResult.data);
    console.log(upResult.data);
  };

  const LoadProgress = () => {
    const bgcolor = "#ef6c00";
    const containerStyles = {
      height: 20,
      width: '50%',
      backgroundColor: "#e0e0de",
      borderRadius: 25,
      margin: 25,
      visibility: `${loadPrg === -1 ? "hidden" : "display" }`
    }
    const fillerStyles = {
      height: '100%',
      width: `${loadPrg == -1 ? 0 : loadPrg}%`,
      backgroundColor: bgcolor,
      borderRadius: 'inherit',
      textAlign: 'center'
    }
    const labelStyles = {
      padding: 5,
      color: 'black',
      fontWeight: 'bold'
    }
    return (
      <div style={containerStyles} >
        <div style={fillerStyles}>
          <span style={labelStyles}>{ loadPrg == -1 ? '0%' : loadPrg == 0 ? 'Loading...' : `${loadPrg}%`}</span>
        </div>
      </div>
    );
  };

  const SetContentButton = () => {
    const { setContent } = useRemirrorContext();
    return (
      <Button onMouseDown={(event) => event.preventDefault()} onClick={() => setContent(nMarkdown)}>
        Replace content
      </Button>
    );
  }

  const SaveProgress = () => {
    const bgcolor = "#ef6c00";
    const containerStyles = {
      height: 20,
      width: '50%',
      backgroundColor: "#e0e0de",
      borderRadius: 25,
      margin: 25,
      visibility: `${ progress === -1 ? "hidden" : "display" }`
    }
    const fillerStyles = {
      height: '100%',
      width: `${progress == -1 ? 0 : progress}%`,
      backgroundColor: bgcolor,
      borderRadius: 'inherit',
      textAlign: 'center'
    }
    const labelStyles = {
      padding: 5,
      color: 'black',
      fontWeight: 'bold'
    }
    return (
      <div style={containerStyles} >
        <div style={fillerStyles}>
          <span style={labelStyles}>{ progress == -1 ? '0%' : progress == 0 ? 'Loading...' : `${progress}%`}</span>
        </div>
      </div>
    );
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
          <br />
          <input type="text" style={{width:'400px'}} placeholder="Input markdown cid(like Qmxxxxx)" value={orgCid} onChange={orgCidChange} / >
          <Button onClick={loadMarkdown}>Load</Button>
          <LoadProgress />
          <SetContentButton />
          <EditorComponent />
          <Button onClick={pinMarkdonw}>Save</Button>
          <p>
            <strong>{MDCid}</strong>
          </p>
          {/* <FloatingLinkToolbar /> */}
          {/* <EmojiPopupComponent /> */}
          {children}
          <ControlledDialogComponent
            visible={showWarning}
            onUpdate={(v) => setShowWarning(v)}
            backdrop={false}
          >
            <p>{warningInfo}</p>
            <div
              className={css`
                display: flex;
                justify-content: space-between;
              `}
            >
              <Button onClick={() => setShowWarning(false)}>Ok</Button>
            </div>
          </ControlledDialogComponent>
        </Remirror>
      </ThemeProvider>
    // </AllStyledComponent>
  );
};
