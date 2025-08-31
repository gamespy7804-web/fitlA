
'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useI18n } from '@/i18n/client';
import { usePathname, useRouter } from 'next/navigation';

export function OnboardingTour({ isReady }: { isReady: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (hasSeenTour) {
      return;
    }

    const driverObj = driver({
        showProgress: true,
        allowClose: false, // Don't allow user to close manually
        doneBtnText: t('onboardingTour.done'),
        nextBtnText: t('onboardingTour.next'),
        prevBtnText: t('onboardingTour.prev'),
        onDeselected: () => {
          // This is a failsafe. If user somehow closes it, mark as seen.
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
      
    const tourSteps: DriveStep[] = [
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
          description: t('onboardingTour.dashboard.description'),
        }
      },
      {
        element: '#nav-actions',
        popover: {
          title: t('onboardingTour.actions.title'),
          description: t('onboardingTour.actions.description'),
          nextBtnText: t('onboardingTour.actions.openMenu'),
          onNextClick: () => {
             const actionButton = document.getElementById('nav-actions');
             if (actionButton) {
                actionButton.click();
                setTimeout(() => driverObj.moveNext(), 200); // Give menu time to open
             }
          }
        },
      },
      {
        element: '#feedback-action',
        popover: {
          title: t('onboardingTour.feedback.title'),
          description: t('onboardingTour.feedback.description'),
          showButtons: [],
        },
        onHighlightStarted: (element) => {
          const feedbackButton = element as HTMLElement;
          const clickHandler = () => {
            // The link click will navigate, so we don't call moveNext() here.
            // The tour will resume on the next page.
            feedbackButton?.removeEventListener('click', clickHandler);
          };
          feedbackButton?.addEventListener('click', clickHandler);
        }
      },
    ];

    const feedbackPageSteps: DriveStep[] = [
       {
        element: '#app-content',
        popover: {
          title: t('onboardingTour.feedbackPage.title'),
          description: t('onboardingTour.feedbackPage.description'),
          onNextClick: () => {
            router.push('/dashboard');
            // Give router time to navigate before highlighting the next step
             setTimeout(() => driverObj.moveNext(), 500);
          }
        }
      },
      {
        element: '.workout-node', // Highlight the first available workout
        popover: {
          title: t('onboardingTour.startWorkout.title'),
          description: t('onboardingTour.startWorkout.description'),
          showButtons: [],
        },
        onHighlightStarted: (element) => {
          const workoutNode = element as HTMLElement;
          const clickHandler = () => {
             // The click will navigate, tour will resume on the workout page
            workoutNode.removeEventListener('click', clickHandler);
          };
          workoutNode.addEventListener('click', clickHandler);
        }
      }
    ];

    const workoutPageSteps: DriveStep[] = [
      {
        element: '#view-technique-btn',
        popover: {
          title: t('onboardingTour.technique.title'),
          description: t('onboardingTour.technique.description'),
        }
      },
      {
        element: '#add-to-feedback-btn',
        popover: {
          title: t('onboardingTour.formAnalysis.title'),
          description: t('onboardingTour.formAnalysis.description'),
        }
      },
      {
        element: '#app-content',
        popover: {
          title: t('onboardingTour.end.title'),
          description: t('onboardingTour.end.description'),
          onDoneClick: () => {
             driverObj.destroy();
          }
        }
      }
    ];

    const runTour = () => {
      const firstWorkoutNode = document.querySelector('.workout-node');

      if (pathname === '/dashboard') {
         if (!firstWorkoutNode) {
            // If there's no workout node, end the tour after chatbot.
            const initialSteps = [...tourSteps];
             initialSteps.splice(3, 0, { // Insert chatbot step after actions
              element: '#chatbot-button',
              popover: {
                title: t('onboardingTour.chatbot.title'),
                description: t('onboardingTour.chatbot.description')
              }
            });
            initialSteps.push({
                 element: '#app-content',
                 popover: {
                   title: t('onboardingTour.end.title'),
                   description: t('onboardingTour.end.description_no_workout'),
                 }
            });
            driverObj.setSteps(initialSteps);

        } else {
            // Full tour
            driverObj.setSteps(tourSteps);
        }
        driverObj.drive();
      } else if (pathname === '/feedback') {
        driverObj.setSteps(feedbackPageSteps);
        driverObj.drive();
      } else if (pathname === '/workout') {
        driverObj.setSteps(workoutPageSteps);
        driverObj.drive();
      }
    }

    // We need to wait a bit for the page to be fully rendered
    setTimeout(runTour, 1000);

  }, [t, pathname, isReady, router]);

  return null;
}
