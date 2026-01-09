import React, { useState, useEffect } from 'react';
import { Building, Users, Settings, Plus, CreditCard as Edit, Trash2, Mail, Phone, MapPin, X, Save, AlertCircle, CheckCircle, Loader2, UserPlus, Crown, Shield, User as UserIcon, Calendar, Globe, Sparkles, RefreshCw, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { organizationService, CreateOrganizationData, UpdateOrganizationData } from '../services/organizationService';
import { authService } from '../services/authService';
import { validateEmail, validatePhone, sanitizePhoneInput } from '../utils/validation';

const OrganizationManagement: React.FC = () => {
  const { t } = useLanguage();
  const { currentOrganization, loadUserOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [operationLoading, setOperationLoading] = useState({
    create: false,
    update: false,
    invite: false,
  });

  // Local organization state to ensure immediate updates
  const [displayOrganization, setDisplayOrganization] = useState(currentOrganization);

  const [createFormData, setCreateFormData] = useState<CreateOrganizationData>({
    name: '',
    email: '',
    address: '',
    phone: '',
  });

  const [editFormData, setEditFormData] = useState<UpdateOrganizationData>({
    name: '',
    email: '',
    address: '',
    phone: '',
  });

  const [inviteFormData, setInviteFormData] = useState({
    email: '',
  });

  // Update display organization when context changes
  useEffect(() => {
    setDisplayOrganization(currentOrganization);
  }, [currentOrganization]);

  const refreshOrganizationData = async () => {
    if (!currentOrganization) return;
    
    try {
      setRefreshing(true);
      console.log('Refreshing organization data for ID:', currentOrganization.id);
      
      // Fetch fresh organization data
      const freshOrgData = await organizationService.getOrganization(currentOrganization.id);
      console.log('Fresh organization data:', freshOrgData);
      
      // Update display immediately
      setDisplayOrganization({
        ...currentOrganization,
        ...freshOrgData,
        avatar: currentOrganization.avatar, // Keep the generated avatar
      });
      
      // Also update the context
      await loadUserOrganization();
      
      showSuccessMessage('✅ Données de l\'organisation actualisées !');
    } catch (err) {
      console.error('Failed to refresh organization data:', err);
      showErrorMessage('❌ Échec de l\'actualisation des données');
    } finally {
      setRefreshing(false);
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 5000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setSuccess(null);
    setTimeout(() => setError(null), 8000);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      email: '',
      address: '',
      phone: '',
    });
  };

  const resetEditForm = () => {
    if (displayOrganization) {
      setEditFormData({
        name: displayOrganization.name,
        email: displayOrganization.email || '',
        address: displayOrganization.address || '',
        phone: displayOrganization.phone || '',
      });
    }
  };

  const resetInviteForm = () => {
    setInviteFormData({
      email: '',
    });
  };

  const validateCreateForm = (): string | null => {
    if (!createFormData.name.trim()) {
      return 'Le nom de l\'organisation est obligatoire.';
    }
    if (!createFormData.email.trim()) {
      return 'L\'email est obligatoire.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) {
      return 'Format d\'email invalide.';
    }
    if (createFormData.name.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères.';
    }
    return null;
  };

  const validateEditForm = (): string | null => {
    if (!editFormData.name?.trim()) {
      return 'Le nom de l\'organisation est obligatoire.';
    }
    if (!editFormData.email?.trim()) {
      return 'L\'email est obligatoire.';
    }
    if (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      return 'Format d\'email invalide.';
    }
    if (editFormData.name && editFormData.name.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères.';
    }
    return null;
  };

  const validateInviteForm = (): string | null => {
    if (!inviteFormData.email.trim()) {
      return 'L\'email est obligatoire.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteFormData.email)) {
      return 'Format d\'email invalide.';
    }
    return null;
  };

  const handleCreateOrganization = async () => {
    const validationError = validateCreateForm();
    if (validationError) {
      showErrorMessage(validationError);
      return;
    }

    try {
      setOperationLoading(prev => ({ ...prev, create: true }));
      setError(null);

      console.log('Creating organization with data:', createFormData);

      // Create the organization
      const newOrganization = await organizationService.createOrganization(createFormData);
      console.log('Organization created:', newOrganization);

      // Immediately fetch the complete organization data to ensure we have all fields
      const completeOrgData = await organizationService.getOrganization(newOrganization.id);
      console.log('Complete organization data fetched:', completeOrgData);

      // Update display immediately with the fresh data
      const displayData = {
        ...completeOrgData,
        avatar: completeOrgData.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2),
        role: 'owner' as const,
        memberCount: 1,
        plan: 'professional' as const,
      };
      
      setDisplayOrganization(displayData);
      console.log('Display organization updated:', displayData);

      // Reload the user's organization data to get the updated information in context
      await loadUserOrganization();
      
      resetCreateForm();
      setShowCreateModal(false);
      showSuccessMessage('🎉 Organisation créée avec succès ! Vous en êtes maintenant le propriétaire.');
      
      // Reload the entire app to ensure all components are updated with the new organization
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Give time for the success message to be seen
    } catch (err) {
      console.error('Failed to create organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de la création de l\'organisation';
      showErrorMessage(`❌ ${errorMessage}`);
    } finally {
      setOperationLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdateOrganization = async () => {
    if (!displayOrganization) return;

    const validationError = validateEditForm();
    if (validationError) {
      showErrorMessage(validationError);
      return;
    }

    try {
      setOperationLoading(prev => ({ ...prev, update: true }));
      setError(null);

      console.log('Updating organization with data:', editFormData);

      await organizationService.updateOrganization(displayOrganization.id, editFormData);
      
      // Immediately fetch the updated organization data
      const updatedOrgData = await organizationService.getOrganization(displayOrganization.id);
      console.log('Updated organization data fetched:', updatedOrgData);
      
      // Update display immediately
      setDisplayOrganization({
        ...displayOrganization,
        ...updatedOrgData,
      });
      
      // Reload organization data in context
      await loadUserOrganization();

      setShowEditModal(false);
      showSuccessMessage('✅ Organisation mise à jour avec succès !');
    } catch (err) {
      console.error('Failed to update organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de la mise à jour de l\'organisation';
      showErrorMessage(`❌ ${errorMessage}`);
    } finally {
      setOperationLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleInviteUser = async () => {
    if (!displayOrganization) {
      showErrorMessage('Aucune organisation sélectionnée.');
      return;
    }

    const validationError = validateInviteForm();
    if (validationError) {
      showErrorMessage(validationError);
      return;
    }

    try {
      setOperationLoading(prev => ({ ...prev, invite: true }));
      setError(null);

      console.log('Inviting user to organization:', displayOrganization.id, inviteFormData.email);

      await organizationService.addUserByEmail(displayOrganization.id, inviteFormData.email);
      
      resetInviteForm();
      setShowInviteModal(false);
      showSuccessMessage('🎉 Invitation envoyée avec succès ! L\'utilisateur recevra un email pour rejoindre l\'organisation.');
    } catch (err) {
      console.error('Failed to invite user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de l\'invitation de l\'utilisateur';
      showErrorMessage(`❌ ${errorMessage}`);
    } finally {
      setOperationLoading(prev => ({ ...prev, invite: false }));
    }
  };

  const openEditModal = () => {
    resetEditForm();
    setShowEditModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={16} className="text-blue-500" />;
      case 'member':
        return <UserIcon size={16} className="text-green-500" />;
      default:
        return <UserIcon size={16} className="text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'admin':
        return 'Administrateur';
      case 'member':
        return 'Membre';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!displayOrganization) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Gestion de l'Organisation</h3>
            <p className="text-gray-600 mt-2">Créez ou rejoignez une organisation pour commencer à collaborer</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in shadow-sm">
            <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
            <span className="text-green-800 font-medium">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in shadow-sm">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
            <span className="text-red-800 font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Empty State */}
        <div className="glass-effect rounded-3xl p-12 text-center border border-white/20">
          <div className="relative mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl w-24 h-24 mx-auto flex items-center justify-center shadow-2xl">
              <Building size={40} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-2 animate-pulse">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucune organisation</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Créez votre propre organisation pour commencer à gérer vos contacts, opportunités et collaborer avec votre équipe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                resetCreateForm();
                setShowCreateModal(true);
              }}
              disabled={operationLoading.create}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-3 justify-center disabled:opacity-50"
            >
              {operationLoading.create ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <Plus size={24} />
                  <span>Créer une Organisation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Create Organization Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3">
                    <Building size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Créer une Organisation</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  disabled={operationLoading.create}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nom de l'organisation *
                  </label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="input-modern"
                    placeholder="Ex: Mon Entreprise SARL"
                    disabled={operationLoading.create}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email professionnel *
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      className="input-modern pl-12"
                      placeholder="contact@monentreprise.com"
                      disabled={operationLoading.create}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={createFormData.address}
                      onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                      className="input-modern pl-12"
                      placeholder="123 Rue de la République, Paris"
                      disabled={operationLoading.create}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                      className="input-modern pl-12"
                      placeholder="+33 1 23 45 67 89"
                      disabled={operationLoading.create}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  disabled={operationLoading.create}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateOrganization}
                  disabled={!createFormData.name || !createFormData.email || operationLoading.create}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {operationLoading.create ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Créer l'Organisation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Gestion de l'Organisation</h3>
          <p className="text-gray-600 mt-2">Gérez les informations et membres de votre organisation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshOrganizationData}
            disabled={refreshing}
            className="bg-gradient-to-r from-gray-600 to-slate-600 text-white px-4 py-3 rounded-xl hover:from-gray-700 hover:to-slate-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={() => {
              resetInviteForm();
              setShowInviteModal(true);
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <UserPlus size={20} />
            <span>Inviter un Utilisateur</span>
          </button>
          <button
            onClick={openEditModal}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Edit size={20} />
            <span>Modifier</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in shadow-sm">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-medium">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-600 hover:text-green-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in shadow-sm">
          <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
          <span className="text-red-800 font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Organization Details Card */}
      <div className="glass-effect rounded-2xl p-8 border border-white/20 shadow-xl">
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl w-20 h-20 flex items-center justify-center text-white font-bold text-2xl shadow-2xl">
              {displayOrganization.avatar || displayOrganization.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full p-2">
              <CheckCircle size={16} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{displayOrganization.name}</h2>
            <div className="flex items-center space-x-4 text-gray-600">
              <span className="flex items-center space-x-1">
                <Building size={16} />
                <span>Organisation #{displayOrganization.id}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>Créée le {displayOrganization.created_at ? new Date(displayOrganization.created_at).toLocaleDateString('fr-FR') : 'N/A'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="bg-blue-500 rounded-lg p-3">
                <Mail size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Email</p>
                <p className="font-semibold text-gray-900">{displayOrganization.email || 'Non renseigné'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="bg-green-500 rounded-lg p-3">
                <Phone size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Téléphone</p>
                <p className="font-semibold text-gray-900">{displayOrganization.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="bg-purple-500 rounded-lg p-3">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Adresse</p>
                <p className="font-semibold text-gray-900">{displayOrganization.address || 'Non renseignée'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="bg-orange-500 rounded-lg p-3">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">Membres</p>
                <p className="font-semibold text-gray-900">1 membre</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Organization Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{displayOrganization.id}</div>
              <div className="text-sm text-gray-600">ID Organisation</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-sm text-gray-600">Membres Actifs</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">
                {displayOrganization.updated_at ? new Date(displayOrganization.updated_at).toLocaleDateString('fr-FR') : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Dernière Mise à Jour</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Organization Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3">
                  <Edit size={24} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Modifier l'Organisation</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                disabled={operationLoading.update}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nom de l'organisation *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="input-modern"
                  placeholder="Entrez le nom de l'organisation"
                  disabled={operationLoading.update}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Email *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="input-modern pl-12"
                    placeholder="contact@organisation.com"
                    disabled={operationLoading.update}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Adresse
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="input-modern pl-12"
                    placeholder="Adresse de l'organisation"
                    disabled={operationLoading.update}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="input-modern pl-12"
                    placeholder="Numéro de téléphone"
                    disabled={operationLoading.update}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                disabled={operationLoading.update}
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateOrganization}
                disabled={!editFormData.name || !editFormData.email || operationLoading.update}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {operationLoading.update ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3">
                  <UserPlus size={24} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Inviter un Utilisateur</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                disabled={operationLoading.invite}
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Comment ça marche ?</h4>
                    <p className="text-blue-800 text-sm">
                      Entrez l'adresse email de la personne que vous souhaitez inviter. 
                      Elle recevra une invitation pour rejoindre votre organisation.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Adresse email *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                    className="input-modern pl-12"
                    placeholder="utilisateur@exemple.com"
                    disabled={operationLoading.invite}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  L'utilisateur recevra un email d'invitation pour rejoindre l'organisation.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                disabled={operationLoading.invite}
              >
                Annuler
              </button>
              <button
                onClick={handleInviteUser}
                disabled={!inviteFormData.email || operationLoading.invite}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {operationLoading.invite ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Envoyer l'Invitation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}   </div>
  );
};

export default OrganizationManagement;