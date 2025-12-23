import React, { useState, Children, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import './Stepper.css';

export const Step = ({ children }) => {
    return <div className="step-content-default">{children}</div>;
};

const Stepper = ({
    initialStep = 1,
    onStepChange,
    onFinalStepCompleted,
    backButtonText = "Back",
    nextButtonText = "Next",
    children
}) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const stepsArray = Children.toArray(children);
    const totalSteps = stepsArray.length;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            const next = currentStep + 1;
            setCurrentStep(next);
            onStepChange?.(next);
        } else {
            onFinalStepCompleted?.();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            const prev = currentStep - 1;
            setCurrentStep(prev);
            onStepChange?.(prev);
        }
    };

    return (
        <div className="outer-container">
            <div className="step-circle-container">
                <div className="step-indicator-row">
                    {stepsArray.map((_, index) => {
                        const stepNum = index + 1;
                        const isCompleted = stepNum < currentStep;
                        const isActive = stepNum === currentStep;

                        return (
                            <React.Fragment key={index}>
                                <div className="step-indicator">
                                    <div
                                        className={`step-indicator-inner ${isActive ? 'active-bg' : isCompleted ? 'completed-bg' : 'inactive-bg'
                                            }`}
                                        style={{
                                            backgroundColor: isActive || isCompleted ? '#ffffff' : '#27272a',
                                            color: isActive || isCompleted ? '#000' : '#a1a1aa'
                                        }}
                                    >
                                        {isCompleted ? (
                                            <Check className="check-icon" style={{ color: '#000' }} />
                                        ) : isActive ? (
                                            <div className="active-dot" style={{ backgroundColor: '#000' }} />
                                        ) : (
                                            <span className="step-number">{stepNum}</span>
                                        )}
                                    </div>
                                </div>
                                {index < totalSteps - 1 && (
                                    <div className="step-connector">
                                        <div
                                            className="step-connector-inner"
                                            style={{
                                                width: isCompleted ? '100%' : '0%',
                                                backgroundColor: '#fff',
                                                transition: 'width 0.3s ease'
                                            }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="step-default">
                    {stepsArray[currentStep - 1]}
                </div>

                <div className="footer-container">
                    <div className={`footer-nav ${currentStep > 1 ? 'spread' : 'end'}`}>
                        {currentStep > 1 && (
                            <button className="back-button" onClick={handleBack}>
                                {backButtonText}
                            </button>
                        )}
                        <button className="next-button" onClick={handleNext}>
                            {currentStep === totalSteps ? 'Finish' : nextButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stepper;
