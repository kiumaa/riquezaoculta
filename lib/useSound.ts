export function useSound() {
  function playClick() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
      osc.onended = () => ctx.close();
    } catch {
      // AudioContext not available — silently ignore
    }

    try {
      if ("vibrate" in navigator) navigator.vibrate(12);
    } catch {
      // vibrate not supported
    }
  }

  function playReveal() {
    try {
      const ctx = new AudioContext();
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        const t = ctx.currentTime + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.10, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t);
        osc.stop(t + 0.22);
        if (i === notes.length - 1) {
          osc.onended = () => ctx.close();
        }
      });
    } catch {
      // AudioContext not available — silently ignore
    }

    try {
      if ("vibrate" in navigator) navigator.vibrate([40, 30, 60]);
    } catch {
      // vibrate not supported
    }
  }

  return { playClick, playReveal };
}
