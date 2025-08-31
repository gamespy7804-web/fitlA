
'use client';

import { useEffect, useState } from 'react';
import { Trophy, Loader2, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserData, type UserProfile } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function RankingPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const { getLeaderboard, loading } = useUserData();
    const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (user) {
                const { topUsers, currentUserData, currentUserRank: rank } = await getLeaderboard(user.uid);
                setLeaderboard(topUsers);
                setCurrentUserRank(rank);
                setCurrentUserProfile(currentUserData);
            }
        };
        fetchLeaderboard();
    }, [getLeaderboard, user]);

    const renderRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="text-yellow-400" />;
        if (rank === 2) return <Trophy className="text-gray-400" />;
        if (rank === 3) return <Trophy className="text-yellow-600" />;
        return <span className="font-bold w-6 text-center">{rank}</span>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <Trophy className="text-primary" />
                    {t('ranking.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('ranking.description')}
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('ranking.leaderboard')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-primary h-12 w-12" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead className="w-16">{t('ranking.table.rank')}</TableHead>
                                       <TableHead>{t('ranking.table.user')}</TableHead>
                                       <TableHead className="text-right">{t('ranking.table.xp')}</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {leaderboard.map((profile, index) => (
                                       <TableRow key={profile.uid}>
                                           <TableCell className="flex items-center justify-center h-12">
                                               {renderRankIcon(index + 1)}
                                           </TableCell>
                                           <TableCell>
                                               <div className="flex items-center gap-3">
                                                   <Avatar>
                                                       <AvatarImage src={profile.photoURL ?? undefined} alt={profile.displayName} />
                                                       <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                                                   </Avatar>
                                                   <span className="font-medium">{profile.displayName}</span>
                                               </div>
                                           </TableCell>
                                           <TableCell className="text-right font-bold text-primary">
                                               {profile.xp.toLocaleString()}
                                           </TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                           {currentUserProfile && currentUserRank && currentUserRank > leaderboard.length && (
                                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}}>
                                    <div className="text-center text-muted-foreground my-4">...</div>
                                    <Card className="bg-primary/10 border-primary">
                                        <Table>
                                            <TableBody>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableCell className="w-16 flex items-center justify-center h-12">
                                                        <span className="font-bold w-6 text-center">{currentUserRank}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={currentUserProfile.photoURL ?? undefined} alt={currentUserProfile.displayName} />
                                                                <AvatarFallback>{currentUserProfile.displayName.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{currentUserProfile.displayName} ({t('ranking.you')})</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-primary">
                                                        {currentUserProfile.xp.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </motion.div>
                           )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
