
'use client';

import { useEffect, useRef } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useI18n } from '@/i18n/client';

export function WorkoutTour() {
  const { t } = useI18n();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const runWorkoutTour = () => {
      // Ensure the tour only tries to run once per component mount
      if (hasRun.current) return;
      hasRun.current = true;
      
      const hasSeenWorkoutTour = localStorage.getItem('hasSeenWorkoutTour');
      if (hasSeenWorkoutTour) {
        return;
      }
      
      setTimeout(() => {
        const viewTechniqueBtn = document.getElementById('view-technique-btn');
        const addToFeedbackBtn = document.getElementById('add-to-feedback-btn');

        if (!viewTechniqueBtn && !addToFeedbackBtn) {
            hasRun.current = false; // Allow re-running on next component if buttons weren't ready
            return;
        }

        const steps: DriveStep[] = [];

        if (viewTechniqueBtn) {
            steps.push({
                element: '#view-technique-btn',
                popover: {
                    title: t('onboardingTour.technique.title'),
                    description: t('onboardingTour.technique.description')
                }
            });
        }

        if (addToFeedbackBtn) {
            steps.push({
                element: '#add-to-feedback-btn',
                popover: {
                    title: t('onboardingTour.formAnalysis.title'),
                    description: t('onboardingTour.formAnalysis.description')
                }
            });
        }

        if (steps.length === 0) return;

        driverRef.current = driver({
          showProgress: true,
          nextBtnText: t('onboardingTour.next'),
          prevBtnText: t('onboardingTour.prev'),
          doneBtnText: t('onboardingTour.done'),
          onDestroyed: () => {
            localStorage.setItem('hasSeenWorkoutTour', 'true');
            driverRef.current = null;
          }
        });
        
        driverRef.current.setSteps(steps);
        driverRef.current.drive();
      }, 1500);
    };

    runWorkoutTour();

    // Cleanup function to destroy driver instance if component unmounts
    return () => {
        if (driverRef.current && driverRef.current.isActve()) {
            driverRef.current.destroy();
            localStorage.setItem('hasSeenWorkoutTour', 'true');
        }
    }
  }, [t]);

  return null;
}
