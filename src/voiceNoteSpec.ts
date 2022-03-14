import { NodeSpec } from "prosemirror-model";


export const VoiceNoteSpec: NodeSpec = {
  attrs: {
    voiceId: {
      default: null
    },
    type: {
      default: 'inline'
    }
  },
  toDOM: () => ['div', { class: 'voiceNote' },  0],
  group: 'block',
  content: 'text*'
};
