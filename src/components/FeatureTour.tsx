import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const FeatureTour = () => {
  const { isFeatureTourShown, setFeatureTourShown } = useStore();
  const [step, setStep] = useState(0);

  const steps = [
    { title: 'Book Appointments', content: 'Book your vet visits here.' },
    { title: 'Health Records', content: 'See your pet\'s medical history.' },
    { title: 'RuRu Assistant', content: 'Chat with RuRu for advice and support.' }
  ];

  if (isFeatureTourShown) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-8 max-w-sm">
        <h2 className="text-xl font-bold mb-2">{steps[step].title}</h2>
        <p className="mb-6">{steps[step].content}</p>
        <button 
          onClick={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else setFeatureTourShown(true);
          }}
          className="w-full bg-ruru-navy-light text-white py-2 rounded-[1.25rem]"
        >
          {step < steps.length - 1 ? 'Next' : 'Finish'}
        </button>
      </div>
    </div>
  );
};
