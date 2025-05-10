import { useEffect, useState } from "react";

const Sequencer = ({ sequence, setSequence }) => {
  function toggleStep(instrument, index) {
    setSequence((prev) => {
      const updateSteps = [...prev[instrument]];
      updateSteps[index] = !updateSteps[index];
      return { ...prev, [instrument]: updateSteps };
    });
  }
  return (
    <section className="sequencer">
      {Object.keys(sequence).map((instrument, index) => {
        return (
          <div key={index + "i"} className="instr-wrapper">
            <span className="instr-name">
              <h3>{instrument.toLocaleUpperCase()}</h3>
            </span>
            <div className="outerseq">
              {sequence[instrument].map((step, index) => {
                let colorClass = "";

                if (index < 4) colorClass = "color-a";
                else if (index < 8) colorClass = "color-b";
                else if (index < 12) colorClass = "color-c";
                else colorClass = "color-d";
                console.log("instrument: ", instrument);

                return (
                  <div
                    key={index}
                    className={`stepbutton ${colorClass}`}
                    onClick={() => toggleStep(instrument, index)}
                  ></div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
};
export default Sequencer;
