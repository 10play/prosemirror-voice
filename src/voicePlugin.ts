import { Plugin, PluginKey, PluginSpec } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
export const DEFAULT_ID = 'prosemirror-voice';
export const pluginKey = new PluginKey(DEFAULT_ID);
type Options = {};
type VoiceState = {
  active?: boolean;
  recognition?: any;
  mediaRecorder?: any;
  interimTranscript?: any;
} | null;

let mediaRecorder: any;
const ptt = (recognition: any, view: EditorView, voiceId: number) => {
  view.dispatch(view.state.tr.insert(view.state.selection.from + 1, view.state.schema.nodes.voiceNote.createAndFill({ voiceId }, view.state.schema.text('start talking...'))))
  var final_transcript = '';
  recognition.onstart = function() {
    console.log('start')
  };

  // @todo: fix any
  recognition.onerror = function(event: any) {
    if (event.error == 'no-speech') {
      console.log('no-speech!')
    }
    if (event.error == 'audio-capture') {
      console.log('audio-capture')
    }
    // if (event.error == 'not-allowed') {
    //   if (event.timeStamp - start_timestamp < 100) {
    //     console.log('info_blocked');
    //   } else {
    //     console.log('info_denied');
    //   }
    //   ignore_onend = true;
    // }
  };

  recognition.onend = function() {
    console.log('end')
  };

  // @todo: fix any
  recognition.onresult = function(event: any) {
    var interim_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    if (final_transcript) {
      view.dispatch(view.state.tr.setMeta(pluginKey, { type: 'finalTranscript', message: final_transcript }))
    } else {
      view.dispatch(view.state.tr.setMeta(pluginKey, { type: 'interimTranscript', message: interim_transcript }))
    }
    console.log('interim_transcript', interim_transcript)
    console.log('final_transcript', final_transcript)
  };
}

export function getVoicePlugin(opts?: Options) {
  const plugin: Plugin<VoiceState> = new Plugin({
    key: pluginKey,
    view() {
      return {
        update: (view, prevState) => {
          const { interimTranscript, active } = plugin.getState(view.state);
          const { interimTranscript: oldInterimTranscript } = plugin.getState(prevState);
          if (oldInterimTranscript !== interimTranscript) {
            const voiceId = active;
            // @todo : find a better way to detect the node
            view.state.doc.descendants((node, pos) => {
              if(node.attrs.voiceId === voiceId) {
                view.dispatch(view.state.tr.replaceRangeWith(pos, pos + node.nodeSize, view.state.schema.nodes.voiceNote.createAndFill({ voiceId }, view.state.schema.text(interimTranscript))))
              }
            })
          }
        },
      };
    },
    state: {
      init: () => {
        var create_email = false;
        var recognizing = false;
        var ignore_onend;
        var start_timestamp;
        if (!('webkitSpeechRecognition' in window)) {
          // upgrade();
          console.log('upgrade browser')
        } else {
          // @ts-ignore
          const recognition = new window.webkitSpeechRecognition();
          recognition.continuous = true;
          recognition.lang = 'en-US';
          recognition.interimResults = true;
          return {
            recognition
          }
        }
      },
      apply(tr, value, oldState, state): any {
        const pluginMessage = tr.getMeta(plugin);
        if (!pluginMessage || !pluginMessage.type) {
          return value;
        }
        if (pluginMessage.type === 'interimTranscript') {
          return {
            ...value,
            interimTranscript: pluginMessage.message,
          };
        }
        if (pluginMessage.type === 'pttChanged') {
          return {
            ...value,
            active: pluginMessage.message,
          };
        }
        return value;
      },
    },
    props: {
      handleKeyDown(view, event) {
        if (event.key !== 'p') {
          return false;
        }
        event.preventDefault();
        const { recognition, active } = plugin.getState(view.state) ?? {};
        const voiceId = active || (new Date()).getTime() // TODO: add uuid
        view.dispatch(view.state.tr.setMeta(plugin, {type: 'pttChanged', message: !active ? voiceId : false }));

        if (active) {
          mediaRecorder.stop();
          recognition.stop();
          return false;
        }
        let audioIN = { audio: true };
        navigator.mediaDevices.getUserMedia(audioIN)
        .then(function (mediaStreamObj) {              
          mediaRecorder = new MediaRecorder(mediaStreamObj);
          mediaRecorder.ondataavailable = function (ev) {
            dataArray.push(ev.data);
          }
          let dataArray: any = [];

          mediaRecorder.onstop = function (ev) {
            let audioData = new Blob(dataArray,
                  { 'type': 'audio/mp3;' });
            dataArray = [];

            let audioSrc = window.URL
              .createObjectURL(audioData);

            // @todo : find a better way to detect the node
            view.state.doc.descendants((node, pos) => {
              if(node.attrs.voiceId === voiceId) {
                view.dispatch(view.state.tr.setNodeMarkup(pos, view.state.schema.voiceNote, { audioSrc }))
              }
            })
          }
          mediaRecorder.start();
          recognition.start();

          ptt(recognition, view, voiceId);
        })
      },
    },
  } as PluginSpec);
  return plugin;
}