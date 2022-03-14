/* eslint-disable import/no-extraneous-dependencies */
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOMParser, Schema } from 'prosemirror-model';
import { nodes, marks } from 'prosemirror-schema-basic';
import { exampleSetup } from 'prosemirror-example-setup';
import '../src/voice.css';
import { getVoicePlugin } from '../src/voicePlugin';
import { VoiceNoteSpec } from '../src/voiceNoteSpec';

const editor = document.querySelector('#editor') as HTMLDivElement;
const content = document.querySelector('#content') as HTMLDivElement;

console.log('nodes', nodes)
const schema = new Schema({
  nodes: { ...nodes, voiceNote: VoiceNoteSpec },
  marks
});

(window as any).view = new EditorView(editor, {
  state: EditorState.create({
    doc: DOMParser.fromSchema(schema).parse(content),
    plugins: [
      getVoicePlugin(),
      ...exampleSetup({ schema, menuBar: false }),
    ],
  }),
});
