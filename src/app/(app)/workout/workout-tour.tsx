
'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useI18n } from '@/i18n/client';

export function WorkoutTour() {
  const { t } = useI18n();

  useEffect(() => {
    const runWorkoutTour = () => {
      const hasSeenWorkoutTour = localStorage.getItem('hasSeenWorkoutTour');
      if (hasSeenWorkoutTour) {
        return;
      }
      
      // We need to wait a bit for the page to be fully rendered
      setTimeout(() => {
        // Check if the necessary elements are on the page
        const viewTechniqueBtn = document.getElementById('view-technique-btn');
        const addToFeedbackBtn = document.getElementById('add-to-feedback-btn');

        if (!viewTechniqueBtn && !addToFeedbackBtn) {
            // If no special buttons are present on this exercise, don't show the tour.
            // It will try again on the next exercise/page load.
            return;
        }

        const steps = [];

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

        const driverObj = driver({
          showProgress: true,
          nextBtnText: t('onboardingTour.next'),
          prevBtnText: t('onboardingTour.prev'),
          doneBtnText: t('onboardingTour.done'),
          onDeselected: () => {
            localStorage.setItem('hasSeenWorkoutTour', 'true');
            driverObj.destroy();
          },
          onDestroyed: () => {
            localStorage.setItem('hasSeenWorkoutTour', 'true');
          }
        });

        driverObj.setSteps(steps);
        driverObj.drive();
      }, 1500);
    };

    runWorkoutTour();
  }, [t]);

  return null;
}
