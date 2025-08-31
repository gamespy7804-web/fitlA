
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
    if (!isReady) return;

    let steps: DriveStep[] = [];
    let tourKey: string | null = null;

    if (pathname.includes('/dashboard')) {
      tourKey = 'hasSeenDashboardTour';
      steps = [
        {
          element: '#app-content',
          popover: {
            title: t('onboardingTour.welcome.title'),
            description: t('onboardingTour.welcome.description')
          }
        },
        {
          element: '.workout-node',
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
          },
        },
        {
          element: '#chatbot-button',
          popover: {
            title: t('onboardingTour.chatbot.title'),
            description: t('onboardingTour.chatbot.description'),
          },
        },
        {
            element: '#app-content',
            popover: {
              title: t('onboardingTour.end.title'),
              description: t('onboardingTour.end.description_dashboard'),
            }
        }
      ];
    } else if (pathname.includes('/feedback')) {
      tourKey = 'hasSeenFeedbackTour';
      steps = [
        {
          element: '#app-content',
          popover: {
            title: t('onboardingTour.feedbackPage.title'),
            description: t('onboardingTour.feedbackPage.description')
          }
        },
        {
            element: 'button[role="tab"][value="technique"]',
            popover: {
                title: t('onboardingTour.feedbackPage.techniqueTab.title'),
                description: t('onboardingTour.feedbackPage.techniqueTab.description')
            }
        },
        {
            element: 'button[role="tab"][value="physique"]',
            popover: {
                title: t('onboardingTour.feedbackPage.physiqueTab.title'),
                description: t('onboardingTour.feedbackPage.physiqueTab.description')
            }
        }
      ];
    } else if (pathname.includes('/workout')) {
      tourKey = 'hasSeenWorkoutTour';
      steps = [
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
            description: t('onboardingTour.end.description_workout'),
          }
        }
      ];
    }

    if (!tourKey || steps.length === 0) return;

    const hasSeenTour = localStorage.getItem(tourKey);
    if (hasSeenTour) return;

    const driverObj = driver({
      showProgress: true,
      doneBtnText: t('onboardingTour.done'),
      nextBtnText: t('onboardingTour.next'),
      prevBtnText: t('onboardingTour.prev'),
      onDestroyed: () => {
        if (tourKey) {
          localStorage.setItem(tourKey, 'true');
        }
      },
    });

    const runTour = () => {
      // Small delay to ensure elements are rendered
      setTimeout(() => {
        driverObj.setSteps(steps);
        driverObj.drive();
      }, 500);
    };

    runTour();

    // Cleanup function
    return () => {
        if (driverObj && driverObj.isActive()) {
            driverObj.destroy();
        }
    }

  }, [t, pathname, isReady]);

  return null;
}
