import { createPageUrl } from '@/utils';

// רכיב עזר לניהול דומיינים שונים
export const DomainHandler = {
    // בדיקה האם זה דומיין מכירתי
    isMarketingDomain() {
        if (typeof window === 'undefined') return false;
        
        const currentDomain = window.location.hostname;
        
        // רשימת דומיינים מכירתיים
        const marketingDomains = [
            'clickmed360.com',
            'www.clickmed360.com',
            'landing.clickmed360.com',
            'marketing.clickmed360.com'
        ];
        
        return marketingDomains.some(domain => currentDomain.includes(domain)) ||
               currentDomain.includes('landing') ||
               currentDomain !== 'app--click-med-a86f0798.base44.app';
    },

    // קבלת URL הראשי של האפליקציה
    getMainAppUrl() {
        return 'https://app--click-med-a86f0798.base44.app';
    },

    // הפניה לדף הנכון בהתאם לדומיין ולמשתמש
    redirectBasedOnDomain(user = null) {
        const isMarketing = this.isMarketingDomain();
        
        if (!user) {
            // משתמש לא מחובר
            if (isMarketing) {
                window.location.href = createPageUrl('LandingPage');
            } else {
                window.location.href = createPageUrl('LandingPage');
            }
        } else {
            // משתמש מחובר
            if (isMarketing) {
                // אם זה דומיין מכירתי והמשתמש מחובר, העבר לאפליקציה הראשית
                const mainAppUrl = this.getMainAppUrl();
                if (user.user_type === 'clinic') {
                    window.location.href = `${mainAppUrl}/Partners`;
                } else {
                    window.location.href = `${mainAppUrl}/Dashboard`;
                }
            } else {
                // דומיין רגיל - העבר לדשבורד המתאים
                if (user.user_type === 'clinic') {
                    window.location.href = createPageUrl('Partners');
                } else {
                    window.location.href = createPageUrl('Dashboard');
                }
            }
        }
    }
};

export default DomainHandler;