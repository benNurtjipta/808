import { useEffect, useRef, useState } from "react";

const StepLights = ({ currentStep }) => {
  const steps = Array(16).fill(null);

  return (
    <section className="lights">
      {steps.map((_, index) => {
        return (
          <div
            key={index}
            className={currentStep === index ? "redbutton" : "blackbutton"}
          ></div>
        );
      })}
    </section>
  );
};
export default StepLights;
