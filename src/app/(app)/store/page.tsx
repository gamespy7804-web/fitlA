
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { Check, Star, Sparkles, ArrowLeft, Tv } from "lucide-react";
import { useUserData } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ShoppingBagIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export default function StorePage() {
    const { t } = useI18n();
    const { toast } = useToast();
    const router = useRouter();
    const { addDiamonds } = useUserData();

    const creditPackages = [
        {
            name: t('store.packages.ad.name'),
            credits: 5,
            price: t('store.packages.ad.price'),
            features: [
                 t('store.packages.ad.feature1'),
                 t('store.packages.ad.feature2'),
            ],
            isAd: true,
        },
        {
            name: t('store.packages.small.name'),
            credits: 50,
            price: '$4.99',
            features: [
                t('store.packages.features.instantAnalysis'),
                t('store.packages.features.errorDetection'),
            ],
            isPopular: false,
        },
        {
            name: t('store.packages.medium.name'),
            credits: 250,
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
            credits: 750,
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

    const handlePurchase = (credits: number, isAd: boolean = false) => {
        // --- SIMULACIÓN DE PAGO ---
        // En una aplicación real, aquí iría la lógica para redirigir a una pasarela de pago como Stripe.
        // La función addDiamonds() solo se llamaría después de que el pago sea confirmado por el servidor.
        addDiamonds(credits);
        toast({
            title: isAd ? t('store.adSuccess.title') : t('store.purchaseSuccess.title'),
            description: t('store.purchaseSuccess.description', { count: credits }),
        });
    };

    return (
        <div className="space-y-6">
            <div>
                 <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                        <ShoppingBagIcon className="h-8 w-8 text-primary" />
                        {t('store.title')}
                    </h1>
                 </div>
                <p className="text-muted-foreground pl-14">
                    {t('store.description')}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
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
                                 <span className={cn("text-4xl font-bold text-foreground", pkg.isAd && "text-primary")}>{pkg.price}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                            <div className="text-center">
                                 <p className="text-5xl font-bold text-primary flex items-center justify-center gap-2">
                                    <span>💎</span>
                                    <span>{pkg.credits}</span>
                                </p>
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
                             <Button size="lg" className="w-full" onClick={() => handlePurchase(pkg.credits, pkg.isAd)} variant={pkg.isAd ? 'outline' : 'default'}>
                                {pkg.isAd ? <Tv className="mr-2"/> : <Sparkles className="mr-2" />}
                                {pkg.isAd ? t('store.watchAd') : t('store.buyNow')}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

    