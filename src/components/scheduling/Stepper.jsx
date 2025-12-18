import React from 'react';

const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="w-full px-8 sm:px-16 pt-8 pb-12">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  index + 1 <= currentStep ? 'bg-[#5932EA] border-[#5932EA]' : 'bg-gray-100 border-gray-300'
                }`}
              >
                {index + 1 < currentStep && <span className="text-white">✓</span>}
              </div>
              <p className={`mt-2 text-xs text-center font-semibold ${index + 1 === currentStep ? 'text-[#5932EA]' : 'text-gray-500'}`}>
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-auto border-t-2 ${index + 1 < currentStep ? 'border-[#5932EA]' : 'border-gray-300'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Stepper;