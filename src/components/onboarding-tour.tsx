
'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useI18n } from '@/i18n/client';
import { usePathname } from 'next/navigation';

export function OnboardingTour({ isReady }: { isReady: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const runOnboardingTour = () => {
      // Only run the main tour on the dashboard
      if (pathname !== '/dashboard') {
        return;
      }
      
      const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
      if (hasSeenTour) {
        return;
      }
      
      // We need to wait a bit for the page to be fully rendered
      setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          nextBtnText: t('onboardingTour.next'),
          prevBtnText: t('onboardingTour.prev'),
          doneBtnText: t('onboardingTour.done'),
          onDeselected: () => {
            localStorage.setItem('hasSeenOnboardingTour', 'true');
            driverObj.destroy();
          },
          onDestroyed: () => {
             const actionButton = document.getElementById('nav-actions');
            if (actionButton?.getAttribute('aria-expanded') === 'true') {
              actionButton.click();
            }
            localStorage.setItem('hasSeenOnboardingTour', 'true');
          }
        });

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
              onNextClick: () => {
                const actionButton = document.getElementById('nav-actions');
                if (actionButton) {
                    actionButton.click();
                }
                driverObj.moveNext();
              }
            } 
          },
          {
            element: '#feedback-action',
            popover: {
              title: t('onboardingTour.feedback.title'),
              description: t('onboardingTour.feedback.description'),
               onNextClick: () => {
                const actionButton = document.getElementById('nav-actions');
                if (actionButton?.getAttribute('aria-expanded') === 'true') {
                  actionButton.click();
                }
                driverObj.moveNext();
              }
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
          }
        ];
        
        const firstWorkoutNode = document.querySelector('.workout-node');
        if (firstWorkoutNode) {
            steps.splice(steps.length -1, 0, { // Insert before the last element
                element: firstWorkoutNode as HTMLElement,
                popover: {
                  title: t('onboardingTour.startWorkout.title'),
                  description: t('onboardingTour.startWorkout.description'),
                },
            });
        }

        steps.push({
            element: '#app-content', 
            popover: { 
              title: t('onboardingTour.end.title'),
              description: t('onboardingTour.end.description')
            } 
        })
        
        driverObj.setSteps(steps);
        driverObj.drive();
      }, 1000);
    };

    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete) {
      runOnboardingTour();
    }
  }, [t, pathname, isReady]);

  return null;
}
