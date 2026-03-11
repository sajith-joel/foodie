import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import { BellIcon, MoonIcon, GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UserSettings = () => {
  const { user } = useAuth();
  const { role } = useRole();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });

  const handleNotificationChange = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
    toast.success('Notification preferences updated');
  };

  return (
    <div className="container-custom py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* Notification Settings */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BellIcon className="h-5 w-5 mr-2 text-primary-600" />
            Notification Preferences
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive order updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={() => handleNotificationChange('email')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-500">Receive real-time updates in browser</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={() => handleNotificationChange('push')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            {role === 'delivery' && (
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive delivery assignments via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={() => handleNotificationChange('sms')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
            )}
          </div>
        </GlassCard>

        {/* Appearance Settings */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MoonIcon className="h-5 w-5 mr-2 text-primary-600" />
            Appearance
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch to dark theme</p>
              </div>
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-gray-500">Choose your preferred language</p>
              </div>
              <select className="border border-gray-300 rounded-lg px-3 py-1">
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
              </select>
            </label>
          </div>
        </GlassCard>

        {/* Security Settings */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-600" />
            Security
          </h2>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => toast.success('Password reset email sent')}
              className="w-full"
            >
              Change Password
            </Button>
            
            <Button
              variant="outline"
              onClick={() => toast.success('2FA settings updated')}
              className="w-full"
            >
              Two-Factor Authentication
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default UserSettings;