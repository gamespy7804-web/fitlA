
'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useI18n } from '@/i18n/client';
import { usePathname } from 'next/navigation';

export function OnboardingTour() {
  const { t } = useI18n();
  const pathname = usePathname();

  useEffect(() => {
    const runOnboardingTour = () => {
      // Only run the main tour on the dashboard
      if (pathname !== '/dashboard') {
        return;
      }
      
      const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
      if (hasSeenTour) {
        return;
      }
      
      setTimeout(() => {
        const steps: DriveStep[] = [
          { 
            element: '#app-content',
            popover: { 
              title: t('onboardingTour.welcome.title'),
              description: t('onboardingTour.welcome.description')
            } 
          },
          { 
            element: '#nav-dashboard',
            popover: { 
              title: t('onboardingTour.dashboard.title'),
              description: t('onboardingTour.dashboard.description')
            }
          },
          { 
            element: '#nav-actions',
            popover: { 
              title: t('onboardingTour.actions.title'),
              description: t('onboardingTour.actions.description'),
              onNextClick: ({ tour }) => {
                // Find and click the button to open the dropdown
                const actionButton = document.getElementById('nav-actions');
                if (actionButton) {
                    actionButton.click();
                    tour.moveNext();
                } else {
                    tour.destroy();
                }
              }
            } 
          },
          {
            element: '#feedback-action',
            popover: {
              title: t('onboardingTour.feedback.title'),
              description: t('onboardingTour.feedback.description'),
            }
          },
          {
            element: '#nav-log',
            popover: {
              title: t('onboardingTour.log.title'),
              description: t('onboardingTour.log.description')
            }
          },
          {
            element: '#nav-games',
            popover: {
              title: t('onboardingTour.games.title'),
              description: t('onboardingTour.games.description')
            }
          },
          {
            element: '#chatbot-button',
            popover: {
              title: t('onboardingTour.chatbot.title'),
              description: t('onboardingTour.chatbot.description')
            }
          },
          {
            element: '.workout-node', // Use a class for the first node
            popover: {
              title: t('onboardingTour.startWorkout.title'),
              description: t('onboardingTour.startWorkout.description'),
            },
          },
          { 
            element: '#app-content', 
            popover: { 
              title: t('onboardingTour.end.title'),
              description: t('onboardingTour.end.description')
            } 
          }
        ];

        const driverObj = driver({
          showProgress: true,
          nextBtnText: t('onboardingTour.next'),
          prevBtnText: t('onboardingTour.prev'),
          doneBtnText: t('onboardingTour.done'),
          steps: steps,
          onCloseClick: () => {
            localStorage.setItem('hasSeenOnboardingTour', 'true');
            driverObj.destroy();
          },
          onDestroyStarted: () => {
             // Close dropdown if open
            const actionButton = document.getElementById('nav-actions');
            if (actionButton && actionButton.ariaExpanded === 'true') {
                actionButton.click();
            }
            if (!driverObj.isLastStep()) {
                localStorage.setItem('hasSeenOnboardingTour', 'true');
                driverObj.destroy();
            }
          },
          onDestroyed: () => {
            localStorage.setItem('hasSeenOnboardingTour', 'true');
          }
        });

        driverObj.drive();
      }, 1000);
    };

    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete) {
      runOnboardingTour();
    }
  }, [t, pathname]);

  return null;
}
