import { Setting } from '@/entities/Setting';
import { Specialty } from '@/entities/Specialty';

class SettingsManager {
    constructor() {
        this.settingsCache = {};
        this.specialtiesCache = [];
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.lastCacheUpdate = 0;
    }

    async loadSettings() {
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.cacheExpiry && Object.keys(this.settingsCache).length > 0) {
            return this.settingsCache;
        }

        try {
            const allSettings = await Setting.list();
            this.settingsCache = allSettings.reduce((acc, setting) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {});
            this.lastCacheUpdate = now;
            return this.settingsCache;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    async loadSpecialties() {
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.cacheExpiry && this.specialtiesCache.length > 0) {
            return this.specialtiesCache;
        }

        try {
            this.specialtiesCache = await Specialty.filter({ is_active: true });
            return this.specialtiesCache;
        } catch (error) {
            console.error('Error loading specialties:', error);
            return [];
        }
    }

    async getSetting(key, defaultValue = null) {
        const settings = await this.loadSettings();
        return settings[key] || defaultValue;
    }

    async getSpecialtyByName(name) {
        const specialties = await this.loadSpecialties();
        return specialties.find(s => s.name === name);
    }

    // Patient appointment limits
    async canPatientScheduleAppointment(patientId, appointmentDate) {
        const settings = await this.loadSettings();
        const dailyLimit = parseInt(settings['patient_appointments_per_day'] || '3');
        const weeklyLimit = parseInt(settings['patient_appointments_per_week'] || '10');

        // Import inside function to avoid circular dependencies
        const { Appointment } = await import('@/entities/Appointment');
        
        try {
            // Check daily limit
            const startOfDay = new Date(appointmentDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(appointmentDate);
            endOfDay.setHours(23, 59, 59, 999);

            const dailyAppointments = await Appointment.filter({
                user_id: patientId,
                date: {
                    $gte: startOfDay.toISOString(),
                    $lte: endOfDay.toISOString()
                }
            });

            if (dailyAppointments.length >= dailyLimit) {
                return { 
                    allowed: false, 
                    reason: `חרגת ממגבלת התורים היומית (${dailyLimit} תורים ביום)` 
                };
            }

            // Check weekly limit
            const startOfWeek = new Date(appointmentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const weeklyAppointments = await Appointment.filter({
                user_id: patientId,
                date: {
                    $gte: startOfWeek.toISOString(),
                    $lte: endOfWeek.toISOString()
                }
            });

            if (weeklyAppointments.length >= weeklyLimit) {
                return { 
                    allowed: false, 
                    reason: `חרגת ממגבלת התורים השבועית (${weeklyLimit} תורים בשבוע)` 
                };
            }

            return { allowed: true };
        } catch (error) {
            console.error('Error checking appointment limits:', error);
            return { allowed: true }; // Allow if check fails
        }
    }

    // Check if duplicate appointment is allowed
    async canScheduleDuplicateAppointment(patientId, specialty, appointmentDate) {
        const settings = await this.loadSettings();
        const allowDuplicates = settings['allow_duplicate_appointments'] === 'true';
        
        if (allowDuplicates) return { allowed: true };

        try {
            const { Appointment } = await import('@/entities/Appointment');
            const startOfDay = new Date(appointmentDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(appointmentDate);
            endOfDay.setHours(23, 59, 59, 999);

            const existingAppointment = await Appointment.filter({
                user_id: patientId,
                specialty: specialty,
                date: {
                    $gte: startOfDay.toISOString(),
                    $lte: endOfDay.toISOString()
                }
            });

            if (existingAppointment.length > 0) {
                return { 
                    allowed: false, 
                    reason: `כבר יש לך תור באותו תחום (${specialty}) ביום זה` 
                };
            }

            return { allowed: true };
        } catch (error) {
            console.error('Error checking duplicate appointments:', error);
            return { allowed: true }; // Allow if check fails
        }
    }

    // Check cancellation policy
    async canCancelAppointment(appointmentDate) {
        const settings = await this.loadSettings();
        const minHours = parseInt(settings['cancellation_hours'] || '4');
        const refundHours = parseInt(settings['cancellation_refund_hours'] || '48');
        
        const now = new Date();
        const appointment = new Date(appointmentDate);
        const hoursDiff = (appointment - now) / (1000 * 60 * 60);

        if (hoursDiff < minHours) {
            return { 
                allowed: false, 
                reason: `לא ניתן לבטל תור פחות מ-${minHours} שעות מראש` 
            };
        }

        const refundAmount = hoursDiff >= refundHours ? 100 : 50;
        return { 
            allowed: true, 
            refundPercentage: refundAmount,
            message: hoursDiff >= refundHours ? 'ביטול מלא' : 'החזר חלקי 50%'
        };
    }

    // Doctor permissions
    async getDoctorPermissions(doctorId) {
        const settings = await this.loadSettings();
        return {
            canEditAvailability: settings['doctors_can_edit_availability'] === 'true',
            canApproveAppointments: settings['doctors_can_approve_appointments'] === 'true',
            showRating: settings['show_doctor_rating'] === 'true',
            appointmentApproval: settings['appointment_approval'] || 'manual'
        };
    }
}

// Export singleton instance
export const settingsManager = new SettingsManager();