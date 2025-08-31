
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Mic, BrainCircuit, ArrowLeft, Bot, User, RotateCw } from 'lucide-react';
import { startOrContinueDebate, type DebateMessage } from '@/ai/flows/debate-flow';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import useAudioEffects from '@/hooks/use-audio-effects';
import { useI18n } from '@/i18n/client';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type GameState = 'topic_select' | 'debating' | 'loading_initial' | 'loading_reply';

export function DebateGame({ onGameFinish }: { onGameFinish: () => void }) {
  const { t, locale } = useI18n();
  const [gameState, setGameState] = useState<GameState>('topic_select');
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [input, setInput] = useState('');
  const { toast } = useToast();
  const playSound = useAudioEffects();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const debateTopics = [
    { id: 'cardio_vs_weights', stance: 'Cardio is better than weights for fat loss.' },
    { id: 'supplements_necessity', stance: 'Dietary supplements are essential for serious athletes.' },
    { id: 'rest_days_overrated', stance: 'Rest days are for the weak; you should train every day.' },
    { id: 'free_weights_vs_machines', stance: 'Free weights are far superior to machines for building muscle.' },
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTopicSelect = async (topicId: string) => {
    playSound('swoosh');
    const selected = debateTopics.find(t => t.id === topicId);
    if (!selected) return;

    setCurrentTopic(t(`games.debate.topics.${topicId}.title`));
    setGameState('loading_initial');
    setMessages([]);

    try {
      const result = await startOrContinueDebate({
        topic: t(`games.debate.topics.${topicId}.title`),
        userStance: t(`games.debate.topics.${topicId}.stance`),
        language: locale,
      });
      setMessages([{ role: 'model', content: result.response }]);
      setGameState('debating');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('games.errors.title'), description: t('games.errors.generationFailed') });
      setGameState('topic_select');
    }
  };

  const handleSendReply = async () => {
    if (!input.trim()) return;
    playSound('click');

    const newUserMessage: DebateMessage = { role: 'user', content: input };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    setGameState('loading_reply');

    try {
      const result = await startOrContinueDebate({
        topic: currentTopic,
        userStance: '', // Not needed after the first message
        history: newMessages,
        language: locale,
      });

      const newAiMessage: DebateMessage = { role: 'model', content: result.response };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
       console.error(error);
      toast({ variant: 'destructive', title: t('games.errors.title'), description: t('games.errors.generationFailed') });
      // Remove the user's message if AI fails
      setMessages(messages);
    } finally {
      setGameState('debating');
    }
  };
  
  const resetGame = () => {
      setGameState('topic_select');
      setCurrentTopic('');
      setMessages([]);
      setInput('');
  }

  const renderTopicSelection = () => (
    <motion.div
        key="topic_select"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full flex flex-col items-center justify-center text-center"
    >
        <BrainCircuit className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-3xl font-bold font-headline mb-2">{t('games.debate.title')}</h2>
        <p className="text-muted-foreground mb-6">{t('games.debate.description')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
            {debateTopics.map((topic) => (
                <Button key={topic.id} variant="outline" className="h-auto py-4 text-wrap" onClick={() => handleTopicSelect(topic.id)}>
                    {t(`games.debate.topics.${topic.id}.title`)}
                </Button>
            ))}
        </div>
    </motion.div>
  );

  const renderDebating = () => (
     <motion.div
      key="debating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col"
    >
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
            <CardTitle className="font-headline text-lg flex items-center justify-between">
                <span>{currentTopic}</span>
                <Button variant="ghost" size="icon" onClick={resetGame}>
                    <RotateCw className="h-4 w-4" />
                </Button>
            </CardTitle>
            <CardDescription>{t('games.debate.challenge')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 pt-2">
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                 <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-start gap-3',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'model' && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'p-3 rounded-lg max-w-xs lg:max-w-md animate-in fade-in',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                             <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                    <User/>
                                </AvatarFallback>
                             </Avatar>
                        )}
                      </div>
                    ))}
                    {gameState === 'loading_reply' && (
                        <div className="flex items-start gap-3 justify-start">
                             <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback></Avatar>
                             <div className="p-3 rounded-lg bg-secondary"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="flex items-center gap-2 pt-2">
                <Textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('games.debate.placeholder')}
                    className="resize-none"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); }}}
                    disabled={gameState !== 'debating'}
                />
                <Button onClick={handleSendReply} disabled={gameState !== 'debating' || !input.trim()}>
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderLoading = () => (
     <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('games.loading')}</p>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col">
         <div className="w-full flex justify-start mb-4">
            <Button variant="ghost" size="icon" onClick={onGameFinish}>
                <ArrowLeft />
            </Button>
        </div>
        <div className="flex-1">
            <AnimatePresence mode="wait">
                {gameState === 'topic_select' && renderTopicSelection()}
                {(gameState === 'debating' || gameState === 'loading_reply') && renderDebating()}
                {gameState === 'loading_initial' && renderLoading()}
            </AnimatePresence>
        </div>
    </div>
  )
}
