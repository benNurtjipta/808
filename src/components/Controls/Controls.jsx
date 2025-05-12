import { useEffect, useRef, useState } from "react";
import WavEncoder from "wav-encoder";

export default function Controls({
  sequence,
  setSequence,
  currentStepRef,
  setCurrentStep,
}) {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSaveSection, setShowSaveSection] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const audioCtxRef = useRef(null);
  const samplesRef = useRef({});
  const nextNoteTimeRef = useRef(0);
  const schedulerIdRef = useRef(null);
  const stepIntervalRef = useRef(60 / bpm / 4);
  const sequenceRef = useRef(sequence);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

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

  async function saveSequenceToWav() {
    if (!fileName.trim()) {
      setError("Please enter a file name.");
      return;
    }

    setError("");

    const ctx = audioCtxRef.current;
    const sampleRate = ctx.sampleRate;
    const duration = 16 * stepIntervalRef.current;
    const totalSamples = Math.floor(sampleRate * duration);
    const outputBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const outputData = outputBuffer.getChannelData(0);

    for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
      const time = stepIndex * stepIntervalRef.current;
      for (const instrument in sequenceRef.current) {
        if (sequenceRef.current[instrument][stepIndex]) {
          const sample = samplesRef.current[instrument];
          const sampleData = sample.getChannelData(0);
          const sampleRateRatio = sampleRate / sample.sampleRate;
          const startSample = Math.floor(time * sampleRate);

          for (let i = 0; i < sampleData.length; i++) {
            const outputIndex = startSample + Math.floor(i * sampleRateRatio);
            if (outputIndex < totalSamples) {
              outputData[outputIndex] += sampleData[i];
            }
          }
        }
      }
    }

    const wavData = await WavEncoder.encode({
      sampleRate,
      channelData: [outputData],
    });

    const blob = new Blob([wavData], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.wav`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function playSound(buffer, time) {
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    source.start(time);
  }

  function scheduleStep(stepIndex, time) {
    const samples = samplesRef.current;
    const currentSequence = sequenceRef.current;

    for (const instrument in currentSequence) {
      if (currentSequence[instrument][stepIndex]) {
        playSound(samples[instrument], time);
      }
    }
  }

  function scheduler() {
    const ctx = audioCtxRef.current;
    const lookahead = 0.1;

    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      scheduleStep(currentStepRef.current, nextNoteTimeRef.current);
      setCurrentStep(currentStepRef.current);
      nextNoteTimeRef.current += stepIntervalRef.current;
      currentStepRef.current = (currentStepRef.current + 1) % 16;
    }

    schedulerIdRef.current = requestAnimationFrame(scheduler);
  }

  async function handleStart() {
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    nextNoteTimeRef.current = audioCtxRef.current.currentTime;

    setIsPlaying(true);
    scheduler();
  }

  function handleStop() {
    if (isPlaying) {
      setIsPlaying(false);
      cancelAnimationFrame(schedulerIdRef.current);
    } else {
      currentStepRef.current = 0;
      setCurrentStep(0);
    }
  }

  function handleBpmChange(newBpm) {
    setBpm(newBpm);
    stepIntervalRef.current = 60 / newBpm / 4;

    if (isPlaying) {
      nextNoteTimeRef.current = audioCtxRef.current.currentTime;
    }
  }

  const handleReset = () => {
    setSequence((prev) => {
      const reset = {};
      for (const instrument in prev) {
        reset[instrument] = prev[instrument].map(() => false);
      }
      return reset;
    });
  };

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code === "Space") {
        event.preventDefault();
        if (isPlaying) {
          handleStop();
        } else {
          handleStart();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying]);

  return (
    <div className="controls-wrapper">
      <div className="controls">
        <button
          className="controlbtn"
          onClick={handleStart}
          disabled={isPlaying}
        >
          START
        </button>
        <button className="controlbtn" onClick={handleStop}>
          STOP
        </button>
        <button className="controlbtn" onClick={handleReset}>
          RESET
        </button>
        <label className="bpm-control">
          BPM:
          <input
            type="number"
            value={bpm}
            min="40"
            max="300"
            onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
          />
        </label>
        <button
          className="controlbtn"
          onClick={() => setShowSaveSection(!showSaveSection)}
        >
          SAVE
        </button>
      </div>
      {showSaveSection && (
        <div className="save-section">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
          />
          <button className="controlbtn" onClick={saveSequenceToWav}>
            SAVE TO FILE
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}
    </div>
  );
}
