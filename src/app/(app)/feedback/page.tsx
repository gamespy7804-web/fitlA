
'use client';

import { FeedbackTool } from "./feedback-tool";
import { useI18n } from "@/i18n/client";

export default function FeedbackPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('feedbackPage.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('feedbackPage.description')}
        </p>
      </div>
      <FeedbackTool />
    </div>
  );
}
