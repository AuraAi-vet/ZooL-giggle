import React from 'react';
import { SOSModal } from './SOSModal';
import { FeedbackModal } from './FeedbackModal';

export const ModalsWrapper = ({ 
  isSOSOpen,
  setIsSOSOpen,
  isFeedbackModalOpen,
  setIsFeedbackModalOpen,
  onSubmitFeedback,
  nearbyEmergencyVets,
  isLoadingEmergency,
  onSOSClick
}: {
  isSOSOpen: boolean;
  setIsSOSOpen: (open: boolean) => void;
  isFeedbackModalOpen: boolean;
  setIsFeedbackModalOpen: (open: boolean) => void;
  onSubmitFeedback: (feedback: any) => Promise<void>;
  nearbyEmergencyVets: any[];
  isLoadingEmergency: boolean;
  onSOSClick: () => void;
}) => {
  return (
    <>
      <SOSModal 
        isOpen={isSOSOpen} 
        onClose={() => setIsSOSOpen(false)} 
        nearbyVets={nearbyEmergencyVets}
        isLoading={isLoadingEmergency}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={onSubmitFeedback}
      />
    </>
  );
};
