import Controls from "./components/Controls/Controls";
import Header from "./components/Header/Header";
import Sequencer from "./components/Sequencer/Sequencer";
import { useRef, useState } from "react";
import StepLights from "./components/StepLights/StepLights";

const App = () => {
  const [sequence, setSequence] = useState({
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    clap: Array(16).fill(false),
    clhh: Array(16).fill(false),
    ophh: Array(16).fill(false),
    cowbell: Array(16).fill(false),
    rim: Array(16).fill(false),
  });
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepRef = useRef(0);

  return (
    <section className="main">
      <Header />
      <Sequencer sequence={sequence} setSequence={setSequence} />
      <StepLights currentStep={currentStep} />
      <Controls
        sequence={sequence}
        setSequence={setSequence}
        currentStepRef={currentStepRef}
        setCurrentStep={setCurrentStep}
      />
    </section>
  );
};
export default App;
