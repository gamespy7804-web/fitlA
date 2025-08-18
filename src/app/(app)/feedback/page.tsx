import { FeedbackTool } from "./feedback-tool";

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Real-time Feedback
        </h1>
        <p className="text-muted-foreground">
          Use your camera to get AI-powered feedback on your exercise form.
        </p>
      </div>
      <FeedbackTool />
    </div>
  );
}
