import { NodeSpec } from "prosemirror-model";


export const VoiceNoteSpec: NodeSpec = {
  attrs: {
    voiceId: {
      default: null
    },
    audioSrc: {
      default: null
    },
    type: {
      default: 'inline'
    }
  },
  toDOM: (node) => {
    return ['div', { class: 'voiceNote', onclick: `(new Audio('${node.attrs.audioSrc}')).play()` }, ['audio', { src: node.attrs.audioSrc }], ['div', 0]]
  },
  group: 'block',
  content: 'text*'
};
