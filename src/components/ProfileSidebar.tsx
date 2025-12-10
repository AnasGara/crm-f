import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Phone, MapPin, Calendar, Building, CreditCard as Edit, Save, Settings, LogOut, 
  CheckCircle, RefreshCw, AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { authService } from '../services/authService';
import { dashboardService, DashboardStats } from '../services/dashboardService';
import { userService } from '../services/userService';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSettings: () => void;
  onLogout: () => void;
  onStatsClick: (statType: string) => void;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  memberSince: string;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  isOpen, 
  onClose, 
  onAccountSettings, 
  onLogout,
  onStatsClick 
}) => {
  const { t } = useLanguage();
  const { currentOrganization } = useOrganization();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const currentUser = authService.getStoredUser();
  const userDisplayName = authService.getUserDisplayName();
  const userInitials = authService.getUserInitials();
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: currentUser?.name || userDisplayName,
    email: currentUser?.email || '',
    phone: '+33 1 23 45 67 89',
    location: 'Paris, France',
    position: 'Abonné',
    memberSince: currentUser?.created_at 
      ? new Date(currentUser.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) 
      : 'Janvier 2024',
  });
  
  const [editedProfile, setEditedProfile] = useState<UserProfile>(userProfile);

  useEffect(() => {
    if (isOpen && currentOrganization) {
      loadDashboardStats();
    }
  }, [isOpen, currentOrganization]);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const stats = await dashboardService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setStatsError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const retryLoadStats = () => {
    setStatsError(null);
    loadDashboardStats();
  };

  const handleEditProfile = () => {
    setEditedProfile(userProfile);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id) {
      setToastMessage('Erreur: Utilisateur non trouvé');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await userService.updateUser(currentUser.id, {
        name: editedProfile.name,
        email: editedProfile.email,
      });

      setUserProfile(editedProfile);
      setIsEditingProfile(false);

      setToastMessage('Profil mis à jour avec succès');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setToastMessage('Erreur lors de la mise à jour du profil');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(userProfile);
    setIsEditingProfile(false);
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'starter': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'Entreprise';
      case 'professional': return 'Professionnel';
      case 'starter': return 'Débutant';
      default: return plan;
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-[60] px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in ${
          toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-xl">{userInitials}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{userProfile.name}</h2>
              <p className="text-blue-100">{userProfile.position}</p>
              <p className="text-blue-200 text-sm">{currentOrganization?.name}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Personal Information */}
          <div className="mb-8">
            {/* Header + Edit Buttons */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Informations Personnelles</h3>
              {!isEditingProfile ? (
                <button onClick={handleEditProfile} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg">
                  <Edit size={16} /><span className="text-sm font-medium">Modifier</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button onClick={handleCancelEdit} className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <X size={16} /><span className="text-sm font-medium">Annuler</span>
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    <span className="text-sm font-medium">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Info */}
            {!isEditingProfile ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Mail size={20} className="text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900 truncate">{userProfile.email}</p>
                  </div>
                </div>
               {/**
                * 
                *  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Phone size={20} className="text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-medium text-gray-900 truncate">{userProfile.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin size={20} className="text-red-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600">Localisation</p>
                    <p className="font-medium text-gray-900 truncate">{userProfile.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar size={20} className="text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600">Membre depuis</p>
                    <p className="font-medium text-gray-900 truncate">{userProfile.memberSince}</p>
                  </div>
                </div>
                    */}
                {currentUser?.email_verified_at && (
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-600">Email vérifié</p>
                      <p className="font-medium text-green-700 text-sm">
                        {new Date(currentUser.email_verified_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {['name', 'email'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field === 'name' ? 'Nom complet' : 'Email'}
                    </label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={(editedProfile as any)[field]}
                      onChange={(e) => setEditedProfile({ ...editedProfile, [field]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Organization Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Organisation Actuelle</h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3">
                  <Building size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{currentOrganization?.name}</h4>
                  <p className="text-blue-600 font-medium capitalize">{currentOrganization?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPlanBadge(currentOrganization?.plan || '')}`}>
                    {getPlanLabel(currentOrganization?.plan || '')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Membres</p>
                  <p className="font-medium text-gray-900">{currentOrganization?.memberCount}</p>
                </div>
              </div>
              {currentUser?.organisation_id && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-600">ID Organisation</p>
                  <p className="font-mono text-sm text-gray-900">{currentUser.organisation_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Statistiques Rapides</h3>
              <button
                onClick={retryLoadStats}
                disabled={statsLoading}
                className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded-md hover:bg-blue-50 disabled:opacity-50"
                title="Actualiser les statistiques"
              >
                <RefreshCw size={16} className={statsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {statsError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <AlertCircle size={24} className="mx-auto text-red-500 mb-2" />
                <p className="text-red-800 text-sm font-medium mb-2">Erreur de chargement</p>
                <p className="text-red-600 text-xs mb-3">{statsError}</p>
                <button
                  onClick={retryLoadStats}
                  className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded-md hover:bg-red-100 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            ) : statsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-xl animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                    <div className="w-12 h-3 bg-gray-200 rounded mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => onStatsClick('contacts')}
                  className="text-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all duration-300 group hover:shadow-lg transform hover:scale-105"
                >
                  <div className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">
                    {dashboardStats?.contacts_count ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Contacts</div>
                  {dashboardStats?.monthly_new_contacts && dashboardStats.monthly_new_contacts > 0 && (
                    <div className="text-xs text-green-500 font-medium mt-1">
                      +{dashboardStats.monthly_new_contacts} ce mois
                    </div>
                  )}
                </button>

                <button
                  onClick={() => onStatsClick('opportunities')}
                  className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 group hover:shadow-lg transform hover:scale-105"
                >
                  <div className="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
                    {dashboardStats?.opportunities_count ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Opportunités</div>
                  {dashboardStats?.pipeline_value && (
                    <div className="text-xs text-blue-500 font-medium mt-1">
                      {parseFloat(dashboardStats.pipeline_value).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => onStatsClick('tasks')}
                  className="text-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all duration-300 group hover:shadow-lg transform hover:scale-105"
                >
                  <div className="text-2xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
                    {dashboardStats?.pending_tasks_count ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Tâches</div>
                  {dashboardStats?.tasks_overdue && dashboardStats.tasks_overdue > 0 && (
                    <div className="text-xs text-red-500 font-medium mt-1">
                      {dashboardStats.tasks_overdue} en retard
                    </div>
                  )}
                </button>

                <button
                  onClick={() => onStatsClick('appointments')}
                  className="text-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all duration-300 group hover:shadow-lg transform hover:scale-105"
                >
                  <div className="text-2xl font-bold text-orange-600 group-hover:scale-110 transition-transform">
                    {dashboardStats?.appointments_today ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">RDV Aujourd'hui</div>
                  {dashboardStats?.organisation_users && dashboardStats.organisation_users > 1 && (
                    <div className="text-xs text-orange-500 font-medium mt-1">
                      {dashboardStats.organisation_users} utilisateurs
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isEditingProfile && (
            <div className="space-y-3">
              <button 
                onClick={onAccountSettings}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Settings size={20} />
                <span>Paramètres du Compte</span>
              </button>
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <LogOut size={20} />
                <span>Se Déconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileSidebar;

