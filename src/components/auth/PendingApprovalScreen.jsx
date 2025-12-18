import React from 'react';
import { User as UserSDK } from '@/entities/User';
import { createPageUrl } from '@/utils';

export default function PendingApprovalScreen({ user }) {
    return (
        <div className="min-h-screen bg-[#FBFAFF] flex items-center justify-center p-6" dir="rtl">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-[0px_10px_60px_rgba(226,236,249,0.5)] p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    חשבונך ממתין לאישור
                </h1>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-right">
                    <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                        שלום {user?.full_name || user?.contact_person}
                    </h2>
                    <p className="text-yellow-700 mb-4">
                        {user?.user_type === 'clinic' 
                            ? 'בקשתך להצטרפות כמרפאה שותפה התקבלה בהצלחה.'
                            : 'בקשתך להצטרפות כרופא/ה התקבלה בהצלחה.'
                        }
                    </p>
                    <p className="text-yellow-700 mb-4">
                        הצוות שלנו בוחן כעת את הפרטים והמסמכים שהגשת.
                        תקבל הודעה במייל ברגע שהחשבון יאושר.
                    </p>
                    <p className="text-sm text-yellow-600">
                        <strong>סטטוס נוכחי:</strong> ממתין לאישור מנהל המערכת
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-right">
                    <p className="text-blue-700 text-sm">
                        <strong>זמן תגובה משוער:</strong> 1-3 ימי עסקים
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={async () => {
                            await UserSDK.logout();
                            window.location.href = createPageUrl('Welcome');
                        }}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        התנתק מהחשבון
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-[#5932EA] text-white rounded-lg hover:bg-[#4a29c1] transition-colors"
                    >
                        רענן דף
                    </button>
                </div>

                <div className="mt-8 text-sm text-gray-500">
                    <p>יש לך שאלות? <a href="mailto:support@clickmed360.com" className="text-[#5932EA] hover:underline">צור קשר עם התמיכה</a></p>
                </div>
            </div>
        </div>
    )
}