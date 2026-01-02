import React from 'react';
      import { Button } from '@/components/ui/button';
      import { Card, CardContent } from '@/components/ui/card';
      import { Badge } from '@/components/ui/badge';
      import { createPageUrl } from '@/utils';
      import { User } from '@/entities/User';
      import { 
          Stethoscope, 
          Clock, 
          Shield, 
          Users, 
          Calendar,
          CheckCircle,
          Star,
          ArrowLeft,
          Phone,
          MessageSquare,
          Award,
          TrendingUp,
          Heart,
          Zap,
          LogIn,
          LogOut
      } from 'lucide-react';

export default function Home() {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);
    const features = [
        {
            icon: Calendar,
            title: "קביעת תורים מהירה",
            description: "תורים אונליין 24/7 עם רופאים מובילים בכל התחומים",
            color: "bg-blue-500"
        },
        {
            icon: Stethoscope,
            title: "רופאים מומחים",
            description: "צוות רפואי מקצועי ומנוסה בכל התמחויות הרפואה",
            color: "bg-green-500"
        },
        {
            icon: Clock,
            title: "זמינות מיידית",
            description: "תורים זמינים עוד היום, ללא המתנה ממושכת",
            color: "bg-purple-500"
        },
        {
            icon: Shield,
            title: "פרטיות מלאה",
            description: "מידע רפואי מאובטח לפי הסטנדרטים הגבוהים ביותר",
            color: "bg-orange-500"
        },
        {
            icon: MessageSquare,
            title: "תמיכה 24/7",
            description: "צוות תמיכה זמין תמיד לעזור ולייעץ",
            color: "bg-red-500"
        },
        {
            icon: TrendingUp,
            title: "מחירים משתלמים",
            description: "תעריפים נגישים ושקופים, עם הנחות למנויים",
            color: "bg-indigo-500"
        }
    ];

    const testimonials = [
        {
            name: "דר' מיכל כהן",
            role: "רופאת משפחה",
            content: "המערכת מאפשרת לי לנהל את התורים שלי בצורה יעילה ונוחה. המטופלים מרוצים מהשירות המהיר.",
            rating: 5
        },
        {
            name: "יוסי לוי",
            role: "מטופל",
            content: "סוף סוף מצאתי מערכת שמאפשרת לי לקבוע תור ברגע שאני צריך. השירות מעולה והרופאים מקצועיים.",
            rating: 5
        },
        {
            name: "מרפאת בריאות הצפון",
            role: "מרפאה שותפה",
            content: "החיבור למערכת הביא לנו המון מטופלים חדשים. זה חיוני לכל מרפאה מודרנית.",
            rating: 5
        }
    ];

    const plans = [
        {
            name: "בסיסי",
            price: "חינם",
            priceSuffix: "",
            features: [
                "זימון תורים בסיסי",
                "ניהול תיק רפואי",
                "התראות ועדכונים",
                "גישה למאגר רופאים"
            ],
            buttonText: "התחל עכשיו",
            buttonVariant: "outline",
            popular: false
        },
        {
            name: "פרמיום",
            price: "₹49",
            priceSuffix: "/חודש",
            features: [
                "כל היתרונות הבסיסיים",
                "עדיפות בקביעת תורים",
                "ייעוץ רפואי 24/7",
                "גישה לרופאים מומחים",
                "הנחות על בדיקות",
                "תמיכה אישית בוואטסאפ"
            ],
            buttonText: "הצטרף עכשיו",
            buttonVariant: "default",
            popular: true
        }
    ];

    const handleCTAClick = () => {
        window.location.href = createPageUrl('Register') + '?from=home';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50" dir="rtl">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap');
                body, html, * {
                    font-family: 'Open Sans', sans-serif !important;
                }
            `}</style>

            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8bfb54141_CLICKMEDLOGO.png" 
                            alt="Clickmed 360" 
                            className="h-16"
                        />
                        <div className="flex items-center gap-4">
                            {loading ? (
                                    <div className="w-32 h-10 bg-gray-200 animate-pulse rounded"></div>
                                ) : user ? (
                                <>
                                    <Button 
                                        variant="default" 
                                        className="bg-[#5932EA] hover:bg-[#4a29c1]"
                                        onClick={() => {
                                            const targetPage = user.user_type === 'clinic' ? 'Partners' : 
                                                               user.user_type === 'doctor' ? 'DoctorAdminPanel' : 
                                                               user.user_type === 'office' ? 'Office' : 'Dashboard';
                                            window.location.href = createPageUrl(targetPage);
                                        }}
                                    >
                                        <LogIn className="ml-2 w-4 h-4" />
                                        כניסה למערכת
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={async () => {
                                            await User.logout();
                                            setUser(null);
                                        }}
                                    >
                                        <LogOut className="ml-2 w-4 h-4" />
                                        התנתקות
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="ghost" onClick={handleCTAClick}>
                                        התחברות
                                    </Button>
                                    <Button className="bg-[#5932EA] hover:bg-[#4a29c1]" onClick={handleCTAClick}>
                                        הרשמה חינם
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="mb-6 bg-purple-100 text-purple-800 text-lg px-6 py-2 rounded-full font-semibold inline-block">
                            🚀 המערכת המתקדמת לשירותי רפואה
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                            רפואה פרטית
                            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                בקליק אחד
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                            קבעו תורים מיידיים עם רופאים מובילים, נהלו את התיק הרפואי שלכם, 
                            וקבלו שירות רפואי מקצועי ואמין - הכל במקום אחד
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            <Button 
                                size="lg" 
                                className="bg-[#5932EA] hover:bg-[#4a29c1] text-white px-12 py-4 text-xl font-bold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
                                onClick={handleCTAClick}
                            >
                                התחילו עכשיו - חינם
                                <ArrowLeft className="mr-3 w-6 h-6" />
                            </Button>
                            <div className="flex items-center gap-3 text-gray-600">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                <span className="text-lg">ללא התחייבות • הרשמה מהירה</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
                        {[
                            { number: "50,000+", label: "מטופלים מרוצים" },
                            { number: "200+", label: "רופאים מומחים" },
                            { number: "95%", label: "שביעות רצון" },
                            { number: "24/7", label: "זמינות" }
                        ].map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-[#5932EA] mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            למה לבחור ב-Clickmed 360?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            אנחנו מביאים לכם את העתיד של הרפואה הפרטית - מתקדם, נוח ואמין
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                                <CardContent className="p-8 text-center">
                                    <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                                        <feature.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            מה אומרים עלינו
                        </h2>
                        <p className="text-xl text-gray-600">
                            אלפי מטופלים ורופאים כבר נהנים מהשירות שלנו
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="border-0 shadow-xl">
                                <CardContent className="p-8">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-gray-700 mb-6 leading-relaxed">
                                        "{testimonial.content}"
                                    </p>
                                    <div>
                                        <div className="font-bold text-gray-900">{testimonial.name}</div>
                                        <div className="text-gray-600">{testimonial.role}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            תוכניות המנויים שלנו
                        </h2>
                        <p className="text-xl text-gray-600">
                            בחרו את התוכנית המתאימה לכם והתחילו היום
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {plans.map((plan, index) => (
                            <Card key={index} className={`border-2 shadow-xl ${plan.popular ? 'border-[#5932EA] transform scale-105' : 'border-gray-200'}`}>
                                {plan.popular && (
                                    <div className="bg-[#5932EA] text-white text-center py-3 rounded-t-lg">
                                        <span className="font-bold">🔥 הפופולרי ביותר</span>
                                    </div>
                                )}
                                <CardContent className="p-8 text-center">
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                                    <div className="mb-6">
                                        <span className="text-5xl font-bold text-[#5932EA]">{plan.price}</span>
                                        <span className="text-xl text-gray-600">{plan.priceSuffix}</span>
                                    </div>
                                    <ul className="space-y-4 mb-8 text-right">
                                        {plan.features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button 
                                        className={`w-full py-4 text-lg font-bold ${plan.popular ? 'bg-[#5932EA] hover:bg-[#4a29c1]' : ''}`}
                                        variant={plan.buttonVariant}
                                        onClick={handleCTAClick}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-[#5932EA] to-[#4a29c1] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        מוכנים להתחיל?
                    </h2>
                    <p className="text-xl mb-12 max-w-3xl mx-auto">
                        הצטרפו למהפכה הרפואית ותהנו משירות רפואי מתקדם, נוח ואמין
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Button 
                            size="lg" 
                            className="bg-white text-[#5932EA] hover:bg-gray-100 px-12 py-4 text-xl font-bold rounded-full"
                            onClick={handleCTAClick}
                        >
                            הרשמה חינם עכשיו
                            <ArrowLeft className="mr-3 w-6 h-6" />
                        </Button>
                        <div className="text-white/80">
                            ✨ ללא עלות • ללא התחייבות • הרשמה מהירה
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8bfb54141_CLICKMEDLOGO.png" 
                            alt="Clickmed 360" 
                            className="h-12 mx-auto mb-6 filter brightness-0 invert"
                        />
                        <p className="text-gray-400 mb-6">
                            שירותי רפואה פרטית מתקדמים ונגישים לכולם
                        </p>
                        <div className="flex justify-center items-center gap-6">
                            <span className="text-gray-400">📞 תמיכה: 1800-CLICKMED</span>
                            <span className="text-gray-400">✉️ info@clickmed360.com</span>
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
                            <p>© 2024 Clickmed 360. כל הזכויות שמורות.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}