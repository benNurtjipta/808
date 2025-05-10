import { useEffect, useState } from "react";

const Sequencer = ({ sequence, setSequence }) => {
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
                return (
                  <div key={index} className={`stepbutton ${colorClass}`}></div>
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
