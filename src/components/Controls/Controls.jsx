import { useEffect, useRef, useState } from "react";

export default function Controls({ sequence }) {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const samplesRef = useRef({});
  const currentStepRef = useRef(0);
  const nextNoteTimeRef = useRef(0);
  const schedulerIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const stepIntervalRef = useRef(60 / bpm / 4);

  useEffect(() => {
    async function loadSamples() {
      const instruments = Object.keys(sequence);
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      for (const inst of instruments) {
        const res = await fetch(`/audio/${inst}.wav`);
        const buffer = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(buffer);
        samplesRef.current[inst] = decoded;
      }
    }

    loadSamples();
  }, []);

  function playSound(buffer, time) {
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    source.start(time);
  }

  function scheduleStep(stepIndex, time) {
    const samples = samplesRef.current;
    for (const instrument in sequence) {
      if (sequence[instrument][stepIndex]) {
        playSound(samples[instrument], time);
      }
    }
  }

  function scheduler() {
    const ctx = audioCtxRef.current;
    const lookahead = 0.1;

    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      scheduleStep(currentStepRef.current, nextNoteTimeRef.current);

      nextNoteTimeRef.current += stepIntervalRef.current;
      currentStepRef.current = (currentStepRef.current + 1) % 16;
    }

    schedulerIdRef.current = requestAnimationFrame(scheduler);
  }

  async function handleStart() {
    await audioCtxRef.current.resume();

    currentStepRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime;
    startTimeRef.current = audioCtxRef.current.currentTime;

    setIsPlaying(true);
    scheduler();
  }

  function handleStop() {
    setIsPlaying(false);
    cancelAnimationFrame(schedulerIdRef.current);
  }

  function handleBpmChange(newBpm) {
    setBpm(newBpm);
    stepIntervalRef.current = 60 / newBpm / 4;

    if (isPlaying) {
      nextNoteTimeRef.current = audioCtxRef.current.currentTime;
    }
  }

  return (
    <div className="controls">
      <label>
        BPM:
        <input
          type="number"
          value={bpm}
          min="40"
          max="300"
          onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
        />
      </label>
      <button onClick={handleStart} disabled={isPlaying}>
        Start
      </button>
      <button onClick={handleStop} disabled={!isPlaying}>
        Stop
      </button>
    </div>
  );
}
