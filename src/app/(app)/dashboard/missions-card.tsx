
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserData } from "@/hooks/use-user-data";
import { weeklyMissions } from "@/lib/missions";
import { useI18n } from "@/i18n/client";
import { CheckCircle2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function MissionsCard() {
    const { t } = useI18n();
    const { missionData } = useUserData();

    if (!missionData) {
        return null; // Or a loading skeleton
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Target className="text-primary" />
                    {t('missions.cardTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {weeklyMissions.map(mission => {
                    const progress = missionData.progress[mission.id];
                    const isCompleted = progress?.completed ?? false;
                    const value = Math.min(((progress?.current ?? 0) / mission.goal) * 100, 100);
                    
                    return (
                        <div key={mission.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                     {isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Target className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <div>
                                        <p className={cn("font-medium", isCompleted && "text-muted-foreground line-through")}>
                                            {t(`missions.missions.${mission.id}.title`)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t(`missions.missions.${mission.id}.description`)}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-semibold text-primary">+{mission.xpReward} XP</span>
                            </div>
                            {!isCompleted && (
                               <Progress value={value} />
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
