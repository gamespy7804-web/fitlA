
'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { generateWorkoutRoutine } from '@/ai/flows/workout-routine-generator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';

// Zod schema creator function to allow for dynamic error messages from i18n
const createFormSchema = (t: (key: string) => string) => z.object({
    sport: z.string().min(1, t('onboarding.validation.sport.min')),
    goals: z.string().min(3, t('onboarding.validation.goals.min')),
    fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: t('workoutGenerator.form.validations.fitnessLevel.required')}),
    trainingDays: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDays.required')}).int().min(1, t('onboarding.validation.trainingDays.min')).max(7, t('onboarding.validation.trainingDays.max')),
    trainingDuration: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDuration.required')}).int().min(15, t('onboarding.validation.trainingDuration.min')).max(240, t('onboarding.validation.trainingDuration.max')),
    age: z.coerce.number({invalid_type_error: t('onboarding.validation.age.required')}).int().min(10, t('onboarding.validation.age.min')).max(100, t('onboarding.validation.age.max')),
    weight: z.coerce.number({invalid_type_error: t('onboarding.validation.weight.required')}).int().min(30, t('onboarding.validation.weight.min')).max(200, t('onboarding.validation.weight.max')),
    gender: z.enum(['male', 'female', 'other'], {required_error: t('onboarding.validation.gender.required')})
});


export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { setOnboardingComplete, saveWorkoutRoutine, setInitialDiamonds } = useUserData();

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const formSchema = createFormSchema((key: string) => t(key as any));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sport: '',
      goals: '',
      trainingDays: 3,
      trainingDuration: 60,
      fitnessLevel: 'beginner',
      age: undefined,
      weight: undefined,
      gender: undefined,
    },
  });

  const sportValue = useWatch({
    control: form.control,
    name: 'sport'
  });

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const routine = await generateWorkoutRoutine({ ...values, language: locale });
      if (routine.structuredRoutine && routine.structuredRoutine.length > 0) {
        
        saveWorkoutRoutine({...routine, sport: values.sport });
        setOnboardingComplete(true);
        setInitialDiamonds(20);

        toast({
          title: t('onboarding.success.title'),
          description: t('onboarding.success.description'),
        });
        router.push('/dashboard');
      } else {
        toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOtherSport = sportValue === 'other';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">{t('onboarding.title')}</CardTitle>
          <CardDescription>{t('onboarding.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <AnimatePresence mode="wait">
                 <motion.div
                    key="onboarding-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="sport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('onboarding.questions.sport.label')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-wrap gap-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="weightlifting" id="weightlifting"/>
                                </FormControl>
                                <Label htmlFor="weightlifting">{t('onboarding.questions.sport.options.weightlifting')}</Label>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="calisthenics" id="calisthenics"/>
                                </FormControl>
                                <Label htmlFor="calisthenics">{t('onboarding.questions.sport.options.calisthenics')}</Label>
                              </FormItem>
                               <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="running" id="running"/>
                                </FormControl>
                                <Label htmlFor="running">{t('onboarding.questions.sport.options.running')}</Label>
                              </FormItem>
                               <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="yoga" id="yoga"/>
                                </FormControl>
                                <Label htmlFor="yoga">{t('onboarding.questions.sport.options.yoga')}</Label>
                              </FormItem>
                               <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="other" id="other"/>
                                </FormControl>
                                <Label htmlFor="other">{t('onboarding.questions.sport.options.other')}</Label>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {isOtherSport && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                             <FormField
                              control={form.control}
                              name="sport"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder={t('onboarding.questions.sport.placeholder')} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </motion.div>
                    )}


                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('onboarding.questions.goals.label')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('onboarding.questions.goals.placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fitnessLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('onboarding.questions.fitnessLevel.label')}</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-4"
                                >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="beginner" id="beginner"/>
                                    </FormControl>
                                    <Label htmlFor="beginner">{t('onboarding.questions.fitnessLevel.options.beginner')}</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="intermediate" id="intermediate"/>
                                    </FormControl>
                                    <Label htmlFor="intermediate">{t('onboarding.questions.fitnessLevel.options.intermediate')}</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="advanced" id="advanced"/>
                                    </FormControl>
                                    <Label htmlFor="advanced">{t('onboarding.questions.fitnessLevel.options.advanced')}</Label>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('onboarding.questions.age.label')}</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder={t('onboarding.questions.age.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('onboarding.questions.weight.label')}</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder={t('onboarding.questions.weight.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('onboarding.questions.gender.label')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('onboarding.questions.gender.placeholder')} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="male">{t('onboarding.questions.gender.options.male')}</SelectItem>
                                            <SelectItem value="female">{t('onboarding.questions.gender.options.female')}</SelectItem>
                                            <SelectItem value="other">{t('onboarding.questions.gender.options.other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="trainingDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('onboarding.questions.trainingDays.label')}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder={t('onboarding.questions.trainingDays.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="trainingDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('onboarding.questions.trainingDuration.label')}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder={t('onboarding.questions.trainingDuration.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                 </motion.div>
                </AnimatePresence>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   <Sparkles className="mr-2" />
                  {t('onboarding.buttons.generate')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    