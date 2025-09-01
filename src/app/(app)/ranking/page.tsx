
'use client';

import { useEffect, useState } from 'react';
import { Trophy, Loader2, Award, Users } from 'lucide-react';
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
        if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400" />;
        if (rank === 2) return <Trophy className="h-6 w-6 text-gray-400" />;
        if (rank === 3) return <Trophy className="h-6 w-6 text-yellow-600" />;
        return (
            <div className='relative flex h-6 w-6 items-center justify-center'>
                <Award className="text-muted-foreground h-6 w-6" />
                <span className="absolute text-xs font-bold text-foreground">{rank}</span>
            </div>
        )
    };
    
    const top3 = leaderboard.slice(0, 3);
    const restOfLeaderboard = leaderboard.slice(3);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <Users className="text-primary" />
                    {t('ranking.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('ranking.description')}
                </p>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-primary h-12 w-12" />
                </div>
            ) : (
             <>
                {/* Top 3 Podium */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 items-end text-center">
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                        {top3[1] && (
                            <Card className="bg-card/50 border-2 border-gray-400/50 pt-4">
                                <Avatar className="h-16 w-16 mx-auto border-4 border-gray-400">
                                    <AvatarImage src={top3[1].photoURL ?? undefined} alt={top3[1].displayName} />
                                    <AvatarFallback>{top3[1].displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-bold text-lg mt-2 truncate px-1">{top3[1].displayName}</p>
                                <p className="text-sm text-muted-foreground">{top3[1].xp.toLocaleString()} XP</p>
                                <div className="bg-gray-400 text-white font-bold p-2 mt-2 rounded-b-lg">2</div>
                            </Card>
                        )}
                    </motion.div>
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                        {top3[0] && (
                             <Card className="bg-card/50 border-4 border-yellow-400 pt-6">
                                <Avatar className="h-20 w-20 mx-auto border-4 border-yellow-400">
                                    <AvatarImage src={top3[0].photoURL ?? undefined} alt={top3[0].displayName} />
                                    <AvatarFallback>{top3[0].displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-bold text-xl mt-2 truncate px-1">{top3[0].displayName}</p>
                                <p className="text-md text-muted-foreground">{top3[0].xp.toLocaleString()} XP</p>
                                <div className="bg-yellow-400 text-white font-bold p-2 mt-2 rounded-b-lg text-lg">1</div>
                            </Card>
                        )}
                    </motion.div>
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                       {top3[2] && (
                             <Card className="bg-card/50 border-2 border-yellow-600/50 pt-4">
                                <Avatar className="h-16 w-16 mx-auto border-4 border-yellow-600">
                                    <AvatarImage src={top3[2].photoURL ?? undefined} alt={top3[2].displayName} />
                                    <AvatarFallback>{top3[2].displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-bold text-lg mt-2 truncate px-1">{top3[2].displayName}</p>
                                <p className="text-sm text-muted-foreground">{top3[2].xp.toLocaleString()} XP</p>
                                <div className="bg-yellow-600 text-white font-bold p-2 mt-2 rounded-b-lg">3</div>
                            </Card>
                        )}
                    </motion.div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('ranking.leaderboard')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead className="w-16 text-center">{t('ranking.table.rank')}</TableHead>
                                   <TableHead>{t('ranking.table.user')}</TableHead>
                                   <TableHead className="text-right">{t('ranking.table.xp')}</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {restOfLeaderboard.map((profile, index) => (
                                   <TableRow key={profile.uid} className={cn(profile.uid === user?.uid && 'bg-primary/10')}>
                                       <TableCell className="flex items-center justify-center h-12 font-bold text-lg">
                                           {renderRankIcon(index + 4)}
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
                                                <TableCell className="w-16 flex items-center justify-center h-12 font-bold text-lg">
                                                    {renderRankIcon(currentUserRank)}
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
                    </CardContent>
                </Card>
             </>
            )}
        </div>
    );
}
