import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as UserSDK } from '@/entities/User';
import { Setting } from '@/entities/Setting';
import { SystemNotification } from '@/entities/SystemNotification';
import { ChatMessage } from '@/entities/ChatMessage'; // Import ChatMessage
import { Referral } from '@/entities/Referral'; // Import Referral
import { Request } from '@/entities/Request'; // Import Request entity for pending payments
import { Appointment } from '@/entities/Appointment'; // Import Appointment entity for pending payments
import { navItems } from '@/components/utils/navigationConfig';
import { format } from 'date-fns'; // Import format from date-fns
import {
    Bell,
    Search,
    User,
    LogOut,
    MessageSquareText,
    UserCheck, // הוספת אייקון חדש
    Menu,
    X,
    LogOut as LogOutIcon, // Renaming for clarity
    Edit, // Added Edit icon for PriceWarningBanner
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Sidebar = ({ user, rolePermissions, menuOrder, isOpen, setIsOpen }) => {
    const location = useLocation();
    const currentPageUrl = location.pathname;

    const canSeePage = (item) => {
        if (!user) return false;

        // Admin always sees everything
        if (user.role === 'admin' || user.permissions?.includes('admin')) {
            return true;
        }

        // Build a comprehensive list of user's roles and permissions
        // Use a Set to ensure unique values
        const userRolesAndPerms = new Set();
        if (user.user_type) {
            userRolesAndPerms.add(user.user_type);
        }
        if (user.permissions) {
            user.permissions.forEach(p => userRolesAndPerms.add(p));
        }
        const userRolesAndPermsArray = [...userRolesAndPerms]; // Convert to array for easier iteration/checking

        // --- PRIMARY CHECK: Hardcoded permissions from navigationConfig.js ---
        if (item.permissions) {
            if (item.permissions.includes('all')) return true;
            if (userRolesAndPermsArray.some(role => item.permissions.includes(role))) {
                return true;
            }
        }

        // --- SECONDARY CHECK: Dynamic permissions from Settings in DB ---
        const systemRoleToSettingsRoleMap = {
            'doctor': 'רופאים ומטפלים',
            'patient': 'מטופלים',
            'clinic': 'מרפאות'
        };

        // Build roles for settings lookup, including mapped system roles
        const settingsRolesToCheck = new Set(userRolesAndPermsArray); // Start with all user roles/perms
        if (user.user_type && systemRoleToSettingsRoleMap[user.user_type]) {
            settingsRolesToCheck.add(systemRoleToSettingsRoleMap[user.user_type]);
        }

        for (const role of [...settingsRolesToCheck]) {
            if (rolePermissions[role]?.includes(item.url)) {
                return true;
            }
        }

        return false;
    };

    const getOrderedNavItems = () => {
        if (!menuOrder || menuOrder.length === 0) return navItems;

        const ordered = [];
        const itemsMap = navItems.reduce((acc, item) => {
            acc[item.url] = item;
            return acc;
        }, {});

        // Add items in the specified order
        menuOrder.forEach(url => {
            if (itemsMap[url]) {
                ordered.push(itemsMap[url]);
            }
        });

        // Add any new items that aren't in the order yet
        navItems.forEach(item => {
            if (!menuOrder.includes(item.url)) {
                ordered.push(item);
            }
        });

        return ordered;
    };

    const orderedNavItems = getOrderedNavItems();
    const visibleNavItems = orderedNavItems.filter(item => canSeePage(item));

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsOpen(false)}></div>}

            <aside
                className={`fixed md:relative top-0 right-0 h-full w-[306px] bg-white flex flex-col z-40 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}
                style={{ boxShadow: '0px 10px 60px rgba(226, 236, 249, 0.5)' }}
            >
                <div className="p-6 flex justify-between items-center shrink-0">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8bfb54141_CLICKMEDLOGO.png" alt="Clickmed 360" className="h-[75px]" />
                    <button onClick={() => setIsOpen(false)} className="md:hidden">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {visibleNavItems.length > 0 ? (
                        visibleNavItems.map((item) => {
                            const isActive = createPageUrl(item.url) === currentPageUrl;
                            return (
                                <Link
                                    key={item.title}
                                    to={createPageUrl(item.url)}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center justify-start gap-4 px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${
                                        isActive ? 'bg-[#5932EA] text-white' : 'bg-white text-[#444444]'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            <p>אין דפים זמינים</p>
                            <p className="text-xs mt-1">יש לבדוק הגדרות הרשאות</p>
                            <div className="mt-2 text-xs text-left">
                                <p>User type: {user?.user_type}</p>
                                <p>Permissions: {JSON.stringify(user?.permissions)}</p>
                                <p>Role permissions keys: {Object.keys(rolePermissions).join(', ')}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 shrink-0">
                    <button
                        onClick={async () => {
                            await UserSDK.logout();
                            window.location.href = createPageUrl('Welcome');
                        }}
                        className="flex items-center justify-center gap-3 px-4 py-2.5 mb-4 border border-gray-200 rounded-lg text-[#444444] hover:text-[#5932EA] transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">התנתק</span>
                    </button>

                    <div className="rounded-lg p-4 text-center text-white" style={{ background: 'linear-gradient(107.91deg, #EAABF0 7.37%, #4623E9 95.19%)' }}>
                        {user?.subscription_type === 'premium' && user?.subscription_status === 'active' ? (
                            <>
                                <h4 className="font-extrabold text-sm leading-tight">מנוי פרמיום פעיל</h4>
                                <div className="text-xs mt-2 space-y-1">
                                    <p>✓ עדיפות בתורים</p>
                                    <p>✓ הנחות על בדיקות</p>
                                    <p>✓ תמיכה 24/7</p>
                                </div>
                                <div className="text-xs mt-2 opacity-80">
                                    בתוקף עד: {user.subscription_end_date ? format(new Date(user.subscription_end_date), 'dd/MM/yyyy') : 'ללא הגבלה'}
                                </div>
                            </>
                        ) : (
                            <>
                                <h4 className="font-extrabold text-sm leading-tight">הצטרפו כמנויים ותהנו מהטבות ואפשרויות נוספות במערכת</h4>
                                <Button asChild className="bg-white text-[#5932EA] hover:bg-gray-100 w-full font-extrabold mt-4 rounded-full shadow-[2px_4px_4px_rgba(79,42,234,0.17)]">
                                    <Link to={createPageUrl('PricingPlans')}>הצטרף כמנוי !</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="text-center py-4 text-xs text-[#838383]">
                        תאריך הצטרפות {new Date().toLocaleDateString('he-IL')}
                    </div>
                </div>
            </aside>
        </>
    );
};

const Header = ({ user, onMenuClick, unreadCount, unreadChatCount, pendingApprovalCount }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const location = useLocation();

    // פונקציה לקבלת כל הדפים הזמינים למשתמש
    const getAvailablePages = () => {
        if (!user) return [];

        const systemRoleToSettingsRoleMap = {
            'doctor': 'רופאים ומטפלים',
            'patient': 'מטופלים',
            'clinic': 'מרפאות'
        };

        // בניית רשימת תפקידי המשתמש
        const userRoles = [];
        if (user.user_type) {
            userRoles.push(user.user_type);
            const mappedRole = systemRoleToSettingsRoleMap[user.user_type];
            if (mappedRole && !userRoles.includes(mappedRole)) {
                userRoles.push(mappedRole);
            }
        }
        if (user.permissions) {
            user.permissions.forEach(permission => {
                if (!userRoles.includes(permission)) {
                    userRoles.push(permission);
                }
            });
        }

        // סינון דפים בהתאם להרשאות
        return navItems.filter(item => {
            // Admin רואה הכל
            if (user.role === 'admin' || user.permissions?.includes('admin')) return true;

            // בדיקה אם למשתמש יש הרשאה לדף זה
            if (item.permissions && (item.permissions.includes('all') || userRoles.some(role => item.permissions.includes(role)))) {
                return true;
            }
            return false;
        });
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim()) {
            const availablePages = getAvailablePages();
            const filtered = availablePages.filter(page =>
                page.title.toLowerCase().includes(query.toLowerCase()) ||
                page.description?.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(filtered);
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const handlePageSelect = (page) => {
        window.location.href = createPageUrl(page.url);
        setSearchQuery('');
        setShowResults(false);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchResults.length > 0) {
            handlePageSelect(searchResults[0]);
        }
    };

    const getUserRoleDisplay = () => {
        if (!user) return 'טוען...';

        // Admin is the highest role
        if (user.role === 'admin' || user.permissions?.includes('admin')) return 'אדמין';

        // Display user_type first - this is the source of truth
        const roleMapping = {
            'doctor': 'רופא',
            'patient': 'מטופל',
            'clinic': 'מרפאה',
            'office': 'משרד' // Added 'office' role
        };

        return roleMapping[user.user_type] || 'מטופל';
    };

    return (
        <header className="bg-white border-b h-[100px] flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="w-6 h-6" />
                </Button>
                <h1 className="text-lg md:text-2xl text-black">
                    <span className="font-bold">שלום,</span> {user?.display_name || user?.full_name || 'ישראל ישראלי'} 👋
                </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-6">
                <div className="relative hidden md:block">
                    <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                        <Input
                            type="search"
                            placeholder="חיפוש"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            onFocus={() => searchQuery && setShowResults(true)}
                            className="bg-white border border-[#E0E0E0] h-10 w-[200px] rounded-[10px] pr-10 text-right text-base"
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <Search className="w-5 h-5 text-[#828282]" />
                        </button>
                    </form>

                    {/* תוצאות החיפוש */}
                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                            {searchResults.map(page => (
                                <button
                                    key={page.url}
                                    onClick={() => handlePageSelect(page)}
                                    className="w-full p-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                >
                                    <page.icon className="w-5 h-5 text-gray-500" />
                                    <div className="text-right flex-1">
                                        <div className="font-semibold text-gray-900">{page.title}</div>
                                        {page.description && (
                                            <div className="text-sm text-gray-500">{page.description}</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {showResults && searchQuery && searchResults.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
                            לא נמצאו דפים תואמים לחיפוש
                        </div>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <img
                        src={user?.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/03e9ff525_6d1f028bc30367a84e0b1efd8a8742d7e99fd62a.png"}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{user?.display_name || user?.full_name || 'ישראל ישראלי'}</p>
                        <p className="text-xs text-gray-500">{getUserRoleDisplay()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    {(user?.role === 'admin' || user?.permissions?.includes('admin')) && pendingApprovalCount > 0 && (
                        <Link to={createPageUrl('Users')} title={`${pendingApprovalCount} משתמשים ממתינים לאישור`}>
                            <div className="relative cursor-pointer" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))' }}>
                                <UserCheck className="w-7 h-7 md:w-9 md:h-9 text-yellow-500" strokeWidth={2} />
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-white">
                                    {pendingApprovalCount}
                                </span>
                            </div>
                        </Link>
                    )}
                    <Link to={createPageUrl('Notifications')}>
                        <div className="relative cursor-pointer" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))' }}>
                            <Bell className="w-7 h-7 md:w-9 md:h-9 text-[#5932EA]" strokeWidth={2} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </Link>
                    <Link to={createPageUrl('Messages')}>
                        <div className="relative cursor-pointer" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))' }}>
                            <MessageSquareText className="w-7 h-7 md:w-9 md:h-9 text-white" fill="#5932EA" />
                            {unreadChatCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                    {unreadChatCount}
                                </span>
                            )}
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
};

const PriceWarningBanner = ({ user, onClick }) => {
    if (!user || user.user_type !== 'doctor' || (user.consultation_fee && user.consultation_fee >= 10)) {
        return null;
    }

    return (
        <div className="bg-red-600 text-white p-3 text-center text-base font-bold flex items-center justify-center gap-4 z-50">
            <span>
                ⚠️ חובה להגדיר מחיר ייעוץ! לא תוכל לקבל תורים עד שתגדיר מחיר (מינימום 10 ש"ח).
            </span>
            <Button
                onClick={onClick}
                variant="secondary"
                className="bg-white text-red-600 hover:bg-gray-200"
                asChild
            >
                <Link to={createPageUrl('DoctorProfile')}>
                    <Edit className="w-4 h-4 ml-2" />
                    הגדר מחיר עכשיו
                </Link>
            </Button>
        </div>
    );
};


const ImpersonationBanner = ({ user, onStopImpersonating }) => (
    <div className="bg-yellow-400 text-black p-2 text-center text-sm flex items-center justify-center gap-4">
        <span>
            ⚠️ אתה צופה במערכת בתור <strong>{user?.display_name || user?.full_name}</strong> ({user?.email})
        </span>
        <Button onClick={onStopImpersonating} size="sm" variant="secondary" className="flex items-center gap-1">
            <LogOutIcon className="w-3 h-3"/>
            חזור לחשבון מנהל
        </Button>
    </div>
);

export default function Layout({ children, currentPageName }) {
    const [user, setUser] = React.useState(null);
    const [adminUser, setAdminUser] = React.useState(null); // For impersonation
    const [isLoading, setIsLoading] = React.useState(true);
    const [rolePermissions, setRolePermissions] = React.useState({});
    const [menuOrder, setMenuOrder] = React.useState([]);
    const [needsRoleSelection, setNeedsRoleSelection] = React.useState(false);
    const [needsProfileCompletion, setNeedsProfileCompletion] = React.useState(false);
    const [needsPendingApproval, setNeedsPendingApproval] = React.useState(false); // NEW STATE
    const [userRole, setUserRole] = React.useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [unreadNotifications, setUnreadNotifications] = React.useState(0);
    const [pendingApprovalCount, setPendingApprovalCount] = React.useState(0); // State for pending users count
    const [unreadChatCount, setUnreadChatCount] = React.useState(0); // State for unread chat conversations
    const [isImpersonating, setIsImpersonating] = React.useState(false);

    React.useEffect(() => {
        document.title = "הפעלת מערכת מנויים פרמיום מלאה";

        const init = async () => {
            setIsLoading(true);

            // --- Domain Handling ---
            const APP_DOMAIN = 'clickmed360.com'; // Main app domain for logged-in users
            const MARKETING_DOMAIN = 'clickmed360.co.il'; // Marketing domain for visitors (Home page only)
            const PREVIEW_DOMAIN_BASE = 'base44.app'; // Base for preview URLs

            const currentDomain = window.location.hostname;
            const isPreviewEnvironment = currentDomain.includes(PREVIEW_DOMAIN_BASE);
            const isAppDomain = currentDomain === APP_DOMAIN;
            const isMarketingDomain = currentDomain === MARKETING_DOMAIN;

            try {
                let currentUser = null;
                let realAdminUser = null;

                try {
                    realAdminUser = await UserSDK.me();
                    console.log('🔍 Real admin user loaded:', realAdminUser.email, realAdminUser.full_name);
                    setAdminUser(realAdminUser); // Always set the real logged in user

                    const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                    const isAdmin = realAdminUser.role === 'admin' || realAdminUser.permissions?.includes('admin');

                    if (impersonatedUserId && isAdmin) {
                        console.log('👥 Impersonation mode detected. Loading user:', impersonatedUserId);
                        currentUser = await UserSDK.get(impersonatedUserId);
                        console.log('👤 Impersonated user loaded:', currentUser.email, currentUser.full_name);
                        setIsImpersonating(true);
                    } else {
                        currentUser = realAdminUser;
                        setIsImpersonating(false);
                        // Clean up session storage if not impersonating
                        sessionStorage.removeItem('impersonatedUserId');
                        sessionStorage.removeItem('adminUserId');
                    }

                    setUser(currentUser);
                    console.log('✅ User session initialized:', {
                        displayedUser: currentUser.email,
                        displayedName: currentUser.full_name,
                        realUser: realAdminUser.email,
                        impersonating: !!impersonatedUserId && isAdmin
                    });


                    // Domain redirects only in production (not in preview environment)
                    if (!isPreviewEnvironment) {
                        // If logged in on marketing domain, redirect to app domain
                        if (isMarketingDomain && currentUser) {
                            const targetPage = currentUser.user_type === 'clinic' ? 'Partners' : 'Dashboard';
                            window.location.href = `https://${APP_DOMAIN}/${targetPage}`;
                            return;
                        }

                        // If not logged in on app domain, redirect to marketing domain Home page
                        if (isAppDomain && !currentUser && currentPageName !== 'Home' && currentPageName !== 'Welcome' && currentPageName !== 'LandingPage') {
                            window.location.href = `https://${MARKETING_DOMAIN}/Home`;
                            return;
                        }
                    }

                    // Handle pending referral logic...
                    const pendingReferral = getCookie('pending_referral');
                    if (pendingReferral && !currentUser.referred_by_clinic_id) {
                        await UserSDK.updateMyUserData({
                            referred_by_clinic_id: pendingReferral
                        });

                        await Referral.create({
                            clinic_id: pendingReferral,
                            patient_id: currentUser.id,
                            patient_name: currentUser.full_name,
                            service: 'הרשמה למערכת',
                            status: 'registered',
                            commission: 50,
                            payment_status: 'pending',
                            date: new Date().toISOString().split('T')[0],
                            referral_link: `${window.location.origin}/Welcome?ref=${pendingReferral}`
                        });

                        document.cookie = 'pending_referral=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        currentUser.referred_by_clinic_id = pendingReferral;
                    }

                    // Check for pending users if admin (using realAdminUser's permissions)
                    if (realAdminUser.role === 'admin' || realAdminUser.permissions?.includes('admin')) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                        const pendingUsers = await UserSDK.filter({ status: 'pending' });
                        setPendingApprovalCount(pendingUsers.length);
                    }

                } catch (e) {
                    console.error('Authentication failed:', e);

                    // In preview environment, allow unauthenticated access to Home/Welcome/LandingPage
                    if (isPreviewEnvironment && (currentPageName === 'Home' || currentPageName === 'Welcome' || currentPageName === 'LandingPage')) {
                        setIsLoading(false);
                        return;
                    }

                    // In production: redirect to marketing domain if not logged in
                    if (!isPreviewEnvironment) {
                        if (isAppDomain && currentPageName !== 'Home' && currentPageName !== 'Welcome' && currentPageName !== 'LandingPage') {
                             window.location.href = `https://${MARKETING_DOMAIN}/Home`;
                             return;
                        }

                        if (isMarketingDomain || currentPageName === 'Home' || currentPageName === 'Welcome' || currentPageName === 'LandingPage') {
                             setIsLoading(false);
                             return;
                        }

                        window.location.href = `https://${MARKETING_DOMAIN}/Home`;
                        return;
                    }

                    setIsLoading(false);
                }

                // If in impersonation mode, skip the onboarding checks for the impersonated user
                if (isImpersonating) {
                    console.log('⏩ Skipping onboarding checks for impersonated user');
                    await loadSettingsAndMenuOrder();
                    setIsLoading(false);
                    return;
                }

                // From here, we assume user is logged in (not impersonating) and on the app domain
                const urlParams = new URLSearchParams(window.location.search);
                const isNewUser = urlParams.get('is_new_user') === 'true';

                const userPermissions = currentUser.permissions || [];
                const isStaff = userPermissions.includes('admin') || userPermissions.includes('מנהל') || userPermissions.includes('office');

                if (isStaff) {
                    await loadSettingsAndMenuOrder();
                    setIsLoading(false);
                    return;
                }

                if ((currentUser.user_type === 'doctor' || currentUser.user_type === 'clinic' || currentUser.user_type === 'office') && currentUser.status !== 'active') {
                    console.log('User pending approval:', {
                        userType: currentUser.user_type,
                        status: currentUser.status,
                        email: currentUser.email
                    });

                    setNeedsPendingApproval(true);
                    setIsLoading(false);
                    return;
                }

                const hasUserType = currentUser.user_type && currentUser.user_type !== '';
                const needsOnboarding = isNewUser || !hasUserType;

                console.log('Onboarding check:', {
                    isNewUser,
                    hasUserType,
                    needsOnboarding,
                    userType: currentUser.user_type,
                    status: currentUser.status
                });

                if (needsOnboarding) {
                    if (!hasUserType) {
                        setNeedsRoleSelection(true);
                        setIsLoading(false);
                        return;
                    }
                }

                if (hasUserType && currentUser.user_type === 'patient' && currentUser.status !== 'active') {
                    let isProfileComplete = !!(currentUser.id_number &&
                                          currentUser.phone &&
                                          currentUser.address &&
                                          currentUser.birth_date);

                    if (!isProfileComplete) {
                        setUserRole(currentUser.user_type);
                        setNeedsProfileCompletion(true);
                        setIsLoading(false);
                        return;
                    }
                }

                if (hasUserType && (currentUser.user_type === 'doctor' || currentUser.user_type === 'clinic' || currentUser.user_type === 'office') && currentUser.status !== 'active') {
                    let isProviderProfileComplete = !!(currentUser.phone &&
                                                        currentUser.license_number &&
                                                        currentUser.specialties &&
                                                        Array.isArray(currentUser.specialties) &&
                                                        currentUser.specialties.length > 0);

                    if (!isProviderProfileComplete) {
                        setUserRole(currentUser.user_type);
                        setNeedsProfileCompletion(true);
                        setIsLoading(false);
                        return;
                    }
                }

                await loadSettingsAndMenuOrder();
                setIsLoading(false);

            } catch (e) {
                console.error("Layout: Error in init function:", e);
                setIsLoading(false);
            }
        };

        const loadSettingsAndMenuOrder = async () => {
            try {
                // Add delays between API calls
                const settingsData = await Setting.filter({ key: 'role_permissions' });
                if (settingsData && settingsData.length > 0) {
                    try {
                        setRolePermissions(JSON.parse(settingsData[0].value));
                    } catch (e) {
                        console.error("Failed to parse role permissions", e);
                        setRolePermissions({});
                    }
                }

                // Add delay before next API call
                await new Promise(resolve => setTimeout(resolve, 100));

                const menuOrderData = await Setting.filter({ key: 'menu_order' });
                if (menuOrderData && menuOrderData.length > 0) {
                    try {
                        setMenuOrder(JSON.parse(menuOrderData[0].value));
                    } catch (e) {
                        console.error("Failed to parse menu order", e);
                        setMenuOrder([]);
                    }
                } else {
                    const defaultOrder = navItems.map(item => item.url);
                    setMenuOrder(defaultOrder);
                }
            } catch (error) {
                console.error("Error loading settings and menu order:", error);
                setRolePermissions({});
                setMenuOrder([]);
            }
        };

        init();

    }, [currentPageName, isImpersonating]); // Changed dependency array to fix loops

    // Separate effect for polling to isolate it and control its dependencies
    useEffect(() => {
        // Helper function inside the effect to avoid polluting global scope
        const getDismissedNotifications = () => {
            const dismissed = sessionStorage.getItem('dismissedNotifications');
            return dismissed ? JSON.parse(dismissed) : [];
        };

        const pollForUpdates = async (userId) => {
            try {
                // CRITICAL FIX: Determine correct user context and notification scope
                const currentUser = user; // Use the already loaded user from state
                const isOffice = currentUser.user_type === 'office' || currentUser.permissions?.includes('office');
                const isAdmin = currentUser.role === 'admin' || currentUser.permissions?.includes('admin');
                
                let totalUnreadCount = 0;
                
                if (isAdmin && !isImpersonating) {
                    const notifications = await SystemNotification.filter({ read: false });
                    totalUnreadCount = notifications.length;
                } else if (isOffice) {
                    // Fetch real notifications that are unread
                    const realNotifications = await SystemNotification.filter({ 
                        read: false,
                        type: { $in: ['system', 'admin', 'payment', 'request_status'] }
                    });
                    
                    // Fetch items that generate virtual notifications
                    const [paymentRequests, paymentAppointments, pendingUsers] = await Promise.all([
                        Request.filter({ status: 'ממתין לתשלום' }),
                        Appointment.filter({ status: 'ממתין לתשלום' }),
                        UserSDK.filter({ status: 'pending' })
                    ]);
                    
                    // Get IDs of virtual notifications that have been dismissed
                    const dismissedIds = getDismissedNotifications();
                    
                    // Count virtual notifications that have NOT been dismissed
                    const unreadVirtualCount = 
                        paymentRequests.filter(p => !dismissedIds.includes(`payment-request-${p.id}`)).length +
                        paymentAppointments.filter(p => !dismissedIds.includes(`payment-appointment-${p.id}`)).length +
                        pendingUsers.filter(u => !dismissedIds.includes(`pending-user-${u.id}`)).length;

                    totalUnreadCount = realNotifications.length + unreadVirtualCount;

                } else {
                    // Regular user or impersonated user
                    const notifications = await SystemNotification.filter({ user_id: userId, read: false });
                    totalUnreadCount = notifications.length;
                }
                
                setUnreadNotifications(totalUnreadCount);

                // Small delay before next API call
                await new Promise(resolve => setTimeout(resolve, 250));

                const unreadMessages = await ChatMessage.filter({ receiver_id: userId, read: false });
                const uniqueSenders = [...new Set(unreadMessages.map(m => m.sender_id))];
                setUnreadChatCount(uniqueSenders.length);

                // This part for pending approval count for admin is separate and correct
                if (adminUser && (adminUser.role === 'admin' || adminUser.permissions?.includes('admin'))) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const pendingUsers = await UserSDK.filter({ status: 'pending' });
                    setPendingApprovalCount(pendingUsers.length);
                }

            } catch (e) {
                console.error("Error fetching notifications/messages:", e);
            }
        };

        if (user && user.id) {
            // Initial poll on user load
            pollForUpdates(user.id);
            
            // Set up the interval
            const pollingInterval = setInterval(() => pollForUpdates(user.id), 60000); // 60 seconds

            // Cleanup on unmount or when user changes
            return () => clearInterval(pollingInterval);
        }
    }, [user, isImpersonating, adminUser]); // Added adminUser to dependencies for polling

    // פונקציית עזר לקריאת קוקי
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    const SuspenseFallback = (
        <div className="min-h-screen bg-[#FBFAFF] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5932EA] mx-auto mb-4"></div>
                <p className="text-gray-600">טוען...</p>
            </div>
        </div>
    );

    const handleStopImpersonating = () => {
        sessionStorage.removeItem('impersonatedUserId');
        sessionStorage.removeItem('adminUserId');
        // Ensure that the redirect goes to the Users page, where the real admin user's session is active
        window.location.href = createPageUrl('Users'); // Redirect to Users page
    };


    // Define handleRoleSelect and onComplete functions here so they can be passed as props
    const handleRoleSelect = async (role) => {
        try {
            // Make sure we update the user_type correctly
            const updateData = {
                user_type: role,
                status: role === 'patient' ? 'active' : 'pending' // Patients are active immediately, providers need approval
            };

            await UserSDK.updateMyUserData(updateData);

            // Reload user data
            const updatedUser = await UserSDK.me();
            setUser(updatedUser);
            setNeedsRoleSelection(false);
            setUserRole(role);

            // Check if profile needs completion
            let isProfileComplete = false;
            if (role === 'patient') {
                isProfileComplete = !!(updatedUser.id_number &&
                                      updatedUser.phone &&
                                      updatedUser.address &&
                                      updatedUser.birth_date);
            } else if (role === 'doctor' || role === 'clinic' || role === 'office') { // Added 'office'
                isProfileComplete = !!(updatedUser.phone &&
                                      updatedUser.license_number &&
                                      updatedUser.specialties &&
                                      Array.isArray(updatedUser.specialties) &&
                                      updatedUser.specialties.length > 0);
            }

            if (!isProfileComplete) {
                setNeedsProfileCompletion(true);
            } else if (role === 'patient') {
                // Patient with complete profile - go to dashboard
                // Ensure redirect happens on the correct app domain
                const appHostname = window.location.hostname.includes('app.clickmed360.co.il')
                    ? 'app.clickmed360.co.il'
                    : 'app--click-med-a86f0798.base44.app';
                window.location.href = `https://${appHostname}/Dashboard`;
            } else {
                // Doctor/clinic/office with complete profile - still needs approval
                setNeedsPendingApproval(true);
            }
        } catch (error) {
            console.error('Layout: Error updating user type:', error);
        }
    };

    const onComplete = () => {
        setNeedsProfileCompletion(false);
        // Force a full reload to re-evaluate all permissions and navigation
        // Ensure redirect happens on the correct app domain
        const appHostname = window.location.hostname.includes('app.clickmed360.co.il')
            ? 'app.clickmed360.co.il'
            : 'app--click-med-a86f0798.base44.app';
        window.location.href = `https://${appHostname}/Dashboard`;
    };

    // Lazy imports for the forms
    const RoleSelectionForm = React.lazy(() => import('@/components/auth/RoleSelectionForm'));
    const ProfileCompletionForm = React.lazy(() => import('@/components/auth/ProfileCompletionForm'));
    const ProviderCompletionForm = React.lazy(() => import('@/components/auth/ProviderCompletionForm'));
    const PendingApprovalScreen = React.lazy(() => import('@/components/auth/PendingApprovalScreen'));

    if (isLoading) {
        return SuspenseFallback;
    }

    // If on Home, Welcome or Landing page, show without Layout
    if (currentPageName === 'Home' || currentPageName === 'Welcome' || currentPageName === 'LandingPage') {
        // In production: redirect logged-in users to the app
        const isPreview = window.location.hostname.includes('base44.app');
        if (user && !isPreview) {
            const targetPage = user.user_type === 'clinic' ? 'Partners' : 'Dashboard';
            window.location.href = `https://clickmed360.com/${targetPage}`;
            return null;
        }
        return children;
    }

    // CRITICAL: Redirect users to correct pages based on their user_type
    // CORRECTED: 'user' already represents the impersonated user when active.
    const activeUserForRedirects = user;
    if (activeUserForRedirects && currentPageName) {
        const isAdmin = activeUserForRedirects.role === 'admin' || activeUserForRedirects.permissions?.includes('admin');

        // Allow admins to access everything
        if (!isAdmin) {
            // Redirect patients away from doctor/clinic/admin/office pages
            if (activeUserForRedirects.user_type === 'patient') {
                const doctorPages = ['DoctorProfile', 'DoctorRequests', 'DoctorAdminPanel', 'DoctorAppointments', 'DoctorPatients'];
                const clinicPages = ['Partners'];
                const adminPages = ['AdminPanel', 'Users', 'Settings', 'Clinics', 'AdminTickets', 'Office', 'Reports', 'Backups', 'Credits'];

                if (doctorPages.includes(currentPageName) ||
                    clinicPages.includes(currentPageName) ||
                    adminPages.includes(currentPageName)) {
                    window.location.href = createPageUrl('Dashboard');
                    return null;
                }
            }

            // Redirect doctors away from patient/clinic/admin/office pages
            if (activeUserForRedirects.user_type === 'doctor') {
                const clinicPages = ['Partners'];
                const adminPages = ['AdminPanel', 'Users', 'Settings', 'Clinics', 'AdminTickets', 'Office', 'Reports', 'Backups', 'Credits'];

                if (currentPageName === 'Dashboard' ||
                    clinicPages.includes(currentPageName) ||
                    adminPages.includes(currentPageName)) {
                    window.location.href = createPageUrl('DoctorAdminPanel');
                    return null;
                }
            }

            // Redirect clinics away from doctor/patient/admin/office pages
            if (activeUserForRedirects.user_type === 'clinic') {
                const doctorPages = ['DoctorProfile', 'DoctorRequests', 'DoctorAdminPanel', 'DoctorAppointments', 'DoctorPatients'];
                const adminPages = ['AdminPanel', 'Users', 'Settings', 'Clinics', 'AdminTickets', 'Office', 'Reports', 'Backups', 'Credits'];

                if (currentPageName === 'Dashboard' ||
                    doctorPages.includes(currentPageName) ||
                    adminPages.includes(currentPageName)) {
                    window.location.href = createPageUrl('Partners');
                    return null;
                }
            }

            // Redirect office staff to Office page if they try to access a page they shouldn't see
            if (activeUserForRedirects.user_type === 'office' || activeUserForRedirects.permissions?.includes('office')) {
                // Pages that are specific to other roles and that an office user should NOT access
                const forbiddenPages = [
                    'Dashboard', // Patient's main page
                    'DoctorAdminPanel', 'DoctorProfile', 'DoctorRequests', 'DoctorAppointments', 'DoctorPatients', // Doctor's main pages
                    'Partners', // Clinic's main page
                    // Admin-ONLY pages (not shared with office)
                    'AdminPanel',
                    'Users',
                    'Settings',
                    'Clinics',
                    'Backups',
                    'Credits',
                    'LandingPagePreview'
                ];

                if (forbiddenPages.includes(currentPageName)) {
                    window.location.href = createPageUrl('Office');
                    return null;
                }
            }
        }
    }

    // Main render logic using the outline's conditional structure
    return (
        <>
            {isImpersonating && <ImpersonationBanner user={user} onStopImpersonating={handleStopImpersonating} />}
            
            {/* NEW: Global Price Warning Banner for doctors */}
            <PriceWarningBanner user={user} />

            {needsPendingApproval && (
                <React.Suspense fallback={SuspenseFallback}>
                    <PendingApprovalScreen user={user} />
                </React.Suspense>
            )}

            {needsRoleSelection && !needsPendingApproval && (
                <React.Suspense fallback={SuspenseFallback}>
                    <div className="min-h-screen bg-[#FBFAFF] flex items-center justify-center p-4">
                        <RoleSelectionForm user={user} onRoleSelect={handleRoleSelect} />
                    </div>
                </React.Suspense>
            )}

            {needsProfileCompletion && !needsRoleSelection && !needsPendingApproval && (
                <React.Suspense fallback={SuspenseFallback}>
                    <div className="min-h-screen bg-[#FBFAFF] flex items-center justify-center p-4">
                        {userRole === 'doctor' || userRole === 'clinic' || userRole === 'office' ? ( // Added 'office'
                            <ProviderCompletionForm user={user} onComplete={onComplete} />
                        ) : (
                            <ProfileCompletionForm user={user} onComplete={onComplete} />
                        )}
                    </div>
                </React.Suspense>
            )}

            {!needsRoleSelection && !needsProfileCompletion && !needsPendingApproval && (
                <div className="min-h-screen bg-gray-50" dir="rtl">
                    <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap');
                    body, html, * {
                        font-family: 'Open Sans', sans-serif !important;
                    }

                    /* Calendar Custom Styles - Mobile First */
                    .rdp {
                        margin: 0 !important;
                        padding: 8px !important;
                    }

                    .rdp-months {
                        width: 100% !important;
                    }

                    .rdp-month {
                        width: 100% !important;
                        margin: 0 !important;
                    }

                    .rdp-table {
                        width: 100% !important;
                        font-size: 11px !important;
                    }

                    .rdp-head_cell {
                        width: 14.28% !important;
                        padding: 2px !important;
                        font-size: 10px !important;
                    }

                    .rdp-cell {
                        width: 14.28% !important;
                        padding: 1px !important;
                    }

                    .rdp-button {
                        width: 28px !important;
                        height: 28px !important;
                        font-size: 10px !important;
                        border-radius: 4px !important;
                    }

                    .rdp-day_selected .rdp-button {
                        background-color: #5932EA !important;
                        color: white !important;
                    }

                    .rdp-day_today .rdp-button {
                        background-color: #f3f4f6 !important;
                        font-weight: bold !important;
                    }

                    .rdp-nav {
                        padding: 4px 8px !important;
                    }

                    .rdp-nav_button {
                        width: 24px !important;
                        height: 24px !important;
                    }

                    .rdp-caption {
                        margin-bottom: 4px !important;
                        font-size: 12px !important;
                    }

                    /* Calendar Custom Styles - Responsive for md screens and up */
                    @media (min-width: 768px) { /* md breakpoint */
                        .rdp {
                        padding: 16px !important;
                        }

                        .rdp-table {
                        font-size: 14px !important;
                        }

                        .rdp-head_cell {
                        padding: 4px !important;
                        font-size: 12px !important;
                        }

                        .rdp-cell {
                        padding: 2px !important;
                        }

                        .rdp-button {
                        width: 32px !important;
                        height: 32px !important;
                        font-size: 12px !important;
                        }

                        .rdp-nav_button {
                        width: 28px !important;
                        height: 28px !important;
                        }

                        .rdp-caption {
                        font-size: 14px !important;
                        }
                    }
                    `}</style>
                    <div className="flex">
                        <Sidebar user={user} rolePermissions={rolePermissions} menuOrder={menuOrder} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                        <div className="flex-1 w-full md:w-[calc(100%-306px)]">
                            <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} unreadCount={unreadNotifications} unreadChatCount={unreadChatCount} pendingApprovalCount={pendingApprovalCount} />
                            <main className="p-4 md:p-6">
                                {children}
                            </main>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}