"use client";

import { useState } from "react";

export default function FlowStepper({
  nodes,
  descs,
}: {
  nodes: string[];
  descs: string[];
}) {
  const [step, setStep] = useState<number>(-1);
  const n = nodes.length;
  const done = step >= n;

  const descHTML =
    step < 0
      ? 'Click <strong>Next Step</strong> to walk through the request flow.'
      : done
      ? '<strong>✓ Flow complete.</strong> Click Reset to start over.'
      : descs[step] ?? "";

  return (
    <div className="flow-stepper">
      <div className="flow-stepper-header">
        <span className="flow-stepper-title">Request Flow — Step Through</span>
        <div className="flow-stepper-controls">
          <button
            className="flow-btn"
            disabled={step < 0}
            onClick={() => setStep(-1)}
          >
            Reset
          </button>
          <button
            className="flow-btn flow-btn-primary"
            disabled={done}
            onClick={() => setStep((s) => s + 1)}
          >
            {step === n - 1 ? "Finish ✓" : "Next Step →"}
          </button>
        </div>
      </div>

      <div className="flow-steps">
        {nodes.map((name, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span className="flow-arrow">→</span>}
            <span
              className={`flow-node ${
                i === step ? "active" : i < step ? "done" : ""
              }`}
            >
              {name}
            </span>
          </span>
        ))}
      </div>

      <div className="flow-desc" dangerouslySetInnerHTML={{ __html: descHTML }} />

      {step >= 0 && !done && (
        <div className="flow-counter">
          Step {step + 1} of {n}
        </div>
      )}
    </div>
  );
}
