const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var wavesurfer = undefined, context = undefined, processor = undefined;

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('start-listing');
  const term = document.getElementById('term');
  const RESPONSES = [
    'Good choice', 'I think I understand', 'hmmm', 'I don\'t like this very much',
    'did I understand correctly?', 'Got it', ''
  ]
  let listening = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const response = () => {
    const speech = new SpeechSynthesisUtterance();
    speech.text = RESPONSES[Math.floor(Math.random() * RESPONSES.length)]
    speech.volume = 1
    speech.rate = 1
    speech.pitch = 1

    window.speechSynthesis.speak(speech)
  }

  if (typeof SpeechRecognition === 'undefined') {
    button.remove();
    const message = document.getElementById('message');
    message.removeAttribute('hidden');
    message.setAttribute('aria-hidden', 'false');

    return
  }

  const recognition = new SpeechRecognition();

  const stop = () => {
    button.classList.remove('speaking');
    recognition.stop();
    button.textContent = 'Start listening';
  };

  const start = () => {
    button.classList.add('speaking');
    recognition.start();
    button.textContent = 'Stop listening';
  };

  const onResult = event => {
    term.value = '';

    const current = event.resultIndex

    const { transcript } = event.results[current][0]

    term.value = transcript;
    response()
  };

  recognition.addEventListener('result', onResult);
  button.addEventListener('click', event => {
    listening ? stop() : start();
    listening = !listening;

    renderWaveSurfer()
  });
});

function renderWaveSurfer() {
  if (wavesurfer === undefined) {
    if (isSafari) {
      // Safari 11 have issues with new AudioContext
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      processor = context.createScriptProcessor(1024, 1, 1);
    }

    // Init wavesurfer
    wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'black',
      interact: false,
      cursorWidth: 0,
      audioContext: context || null,
      audioScriptProcessor: processor || null,
      plugins: [
        WaveSurfer.microphone.create({
          bufferSize: 4096,
          numberOfInputChannels: 1,
          numberOfOutputChannels: 1,
          constraints: {
            video: false,
            audio: true
          }
        })
      ]
    });

    wavesurfer.microphone.on('deviceReady', function () {
      console.info('Device ready!');
    });
    wavesurfer.microphone.on('deviceError', function (code) {
      console.error('Device error: ' + code);
    });
    wavesurfer.on('error', function (e) {
      console.error(e);
    });
    wavesurfer.microphone.start();
  } else {
    if (wavesurfer.microphone.active) {
      wavesurfer.microphone.stop();
    } else {
      wavesurfer.microphone.start();
    }
  }
}