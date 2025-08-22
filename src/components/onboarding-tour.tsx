
'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useI18n } from '@/i18n/client';
import { Button } from './ui/button';

export function OnboardingTour() {
  const { t } = useI18n();

  useEffect(() => {
    const runOnboardingTour = () => {
      const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
      if (hasSeenTour) {
        return;
      }
      
      // We need to wait a bit for the page to be fully rendered, especially the workout path
      setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          nextBtnText: t('onboardingTour.next'),
          prevBtnText: t('onboardingTour.prev'),
          doneBtnText: t('onboardingTour.done'),
          steps: [
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
                description: t('onboardingTour.actions.description')
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
              element: '#app-content', 
              popover: { 
                title: t('onboardingTour.end.title'),
                description: t('onboardingTour.end.description')
              } 
            }
          ],
          onCloseClick: () => {
            localStorage.setItem('hasSeenOnboardingTour', 'true');
            driverObj.destroy();
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
  }, [t]);

  return null;
}

