
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { Check, ShoppingBag, Sparkles, Star } from "lucide-react";
import { useUserData } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ShoppingBagIcon } from "@/components/icons";

export default function StorePage() {
    const { t } = useI18n();
    const { toast } = useToast();
    const { addFeedbackCredits } = useUserData();

    const creditPackages = [
        {
            name: t('store.packages.small.name'),
            credits: 5,
            price: '$4.99',
            features: [
                t('store.packages.features.instantAnalysis'),
                t('store.packages.features.errorDetection'),
            ],
            isPopular: false,
        },
        {
            name: t('store.packages.medium.name'),
            credits: 20,
            price: '$14.99',
            features: [
                t('store.packages.features.instantAnalysis'),
                t('store.packages.features.errorDetection'),
                t('store.packages.features.prioritySupport'),
            ],
            isPopular: true,
        },
        {
            name: t('store.packages.large.name'),
            credits: 50,
            price: '$29.99',
            features: [
                t('store.packages.features.instantAnalysis'),
                t('store.packages.features.errorDetection'),
                t('store.packages.features.prioritySupport'),
                t('store.packages.features.betaAccess'),
            ],
            isPopular: false,
        }
    ]

    const handlePurchase = (credits: number) => {
        addFeedbackCredits(credits);
        toast({
            title: t('store.purchaseSuccess.title'),
            description: t('store.purchaseSuccess.description', { count: credits }),
        });
        // Here you would integrate with a real payment provider like Stripe
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <ShoppingBagIcon className="h-8 w-8 text-primary" />
                    {t('store.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('store.description')}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creditPackages.map((pkg) => (
                    <Card key={pkg.name} className={cn("flex flex-col", pkg.isPopular && "border-primary border-2 shadow-lg shadow-primary/20")}>
                        {pkg.isPopular && (
                             <div className="flex justify-center -mt-3">
                                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <Star className="h-4 w-4" />
                                    {t('store.popular')}
                                </div>
                            </div>
                        )}
                        <CardHeader className="text-center">
                            <CardTitle className="font-headline text-2xl">{pkg.name}</CardTitle>
                            <CardDescription>
                                 <span className="text-4xl font-bold text-foreground">{pkg.price}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                            <div className="text-center">
                                 <p className="text-5xl font-bold text-primary">{pkg.credits}</p>
                                 <p className="text-lg font-medium text-muted-foreground">{t('store.credits')}</p>
                            </div>
                           
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {pkg.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                             <Button size="lg" className="w-full" onClick={() => handlePurchase(pkg.credits)}>
                                <Sparkles className="mr-2" />
                                {t('store.buyNow')}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

    