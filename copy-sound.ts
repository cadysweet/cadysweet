let audioContext: AudioContext | undefined;

/** Unlock audio during the click; play the confirmation only after copying succeeds. */
export function prepareCopyTone(): () => void {
  const silent = () => {};
  try {
    const AudioConstructor = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioConstructor) return silent;

    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioConstructor();
    }
    const context = audioContext;
    // Resume before any clipboard await so mobile browsers see the user's gesture.
    const ready = context.state === "running"
      ? Promise.resolve(true)
      : context.resume().then(() => true, () => false);

    return () => {
      void ready.then((enabled) => {
        if (!enabled || context.state !== "running") return;
        const start = context.currentTime;
        for (const [offset, frequency] of [[0, 660], [0.085, 880]]) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const time = start + offset;
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.exponentialRampToValueAtTime(0.1, time + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
          oscillator.start(time);
          oscillator.stop(time + 0.13);
        }
      }).catch(() => {});
    };
  } catch {
    // An unsupported or blocked audio device must never interrupt copying.
    return silent;
  }
}
