import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  Users,
  Target,
  Calendar,
  Mail,
  BarChart3,
  Shield,
  Globe,
  ArrowRight,
  Check,
  Star,
  X,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { authService, LoginResponse } from '../services/authService';
import { validateEmail, validateRequired, validateMinLength } from '../utils/validation'; // Import LoginResponse

interface LandingPageProps {
  onLogin: (loginResponse: LoginResponse) => void; // Expect LoginResponse
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [signInData, setSignInData] = useState({
    email: 'danaffs2@test.com',
    password: 'secret123',
  });

  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const features = [
    {
      icon: Users,
      title: t('contactManagement'),
      description: t('contactManagementDesc'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: t('salesPipelineFeature'),
      description: t('salesPipelineDesc'),
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Calendar,
      title: t('smartScheduling'),
      description: t('smartSchedulingDesc'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Mail,
      title: t('emailCampaignsFeature'),
      description: t('emailCampaignsDesc'),
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: BarChart3,
      title: t('advancedAnalytics'),
      description: t('advancedAnalyticsDesc'),
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Shield,
      title: t('enterpriseSecurity'),
      description: t('enterpriseSecurityDesc'),
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'PDG, TechCorp',
      content: 'GDPilia a transformé notre processus de vente. Nous avons augmenté notre taux de conversion de 40% en seulement 3 mois.',
      avatar: 'SJ',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Directeur des Ventes, Innovate.io',
      content: 'Les insights alimentés par IA nous ont aidés à identifier des opportunités que nous manquions. Plateforme incroyable !',
      avatar: 'MC',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Responsable Marketing, Digital Future',
      content: 'Le meilleur CRM que nous ayons jamais utilisé. L\'interface est intuitive et les fonctionnalités sont exactement ce dont nous avions besoin.',
      avatar: 'ER',
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: 'Débutant',
      price: '29€',
      period: '/mois',
      description: 'Parfait pour les petites équipes qui commencent',
      features: [
        'Jusqu\'à 1 000 contacts',
        'Gestion de pipeline basique',
        'Intégration email',
        'Accès application mobile',
        'Support standard',
      ],
      popular: false,
    },
    {
      name: 'Professionnel',
      price: '79€',
      period: '/mois',
      description: 'Idéal pour les entreprises en croissance',
      features: [
        'Jusqu\'à 10 000 contacts',
        'Gestion de pipeline avancée',
        'Campagnes email automatisées',
        'Analyses avancées et rapports',
        'Accès API complet',
        'Support prioritaire',
      ],
      popular: true,
    },
    {
      name: 'Entreprise',
      price: '199€',
      period: '/mois',
      description: 'Pour les grandes organisations',
      features: [
        'Contacts illimités',
        'Workflows personnalisés',
        'Intégrations avancées',
        'Options marque blanche',
        'Gestionnaire de compte dédié',
        'Support téléphonique 24/7',
      ],
      popular: false,
    },
  ];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.login(signInData);
      console.log('Login response:', response);
      
      // Check if it's first time login
      if (response.first_time_login === 1) {
        console.log('First time login detected');
        // You can handle first-time login flow here if needed
      }
      
      onLogin(response); // Pass the response object
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrorMessage(error.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
      setShowErrorToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        name: `${signUpData.firstName} ${signUpData.lastName}`,
        email: signUpData.email,
        password: signUpData.password,
        organisation_id: null, // Set organisation_id to null
      };

      const response = await authService.register(registerData);
      console.log('Registration response:', response);
      
      // Show success toast
      setSuccessMessage('🎉 Compte créé avec succès ! Bienvenue dans GDPilia !');
      setShowSuccessToast(true);
      
      // Close the signup modal
      setShowSignUp(false);
      resetSignUpForm();
      
      // Connect user directly to the app after a short delay
      setTimeout(() => {
        onLogin(response); // Pass the response object
      }, 1500);
    } catch (error: any) {
      console.error('Registration failed:', error);

      // Extract error message from the API response
      let errorMsg = 'Échec de l\'inscription. Veuillez réessayer.';

      if (error.message) {
        errorMsg = error.message;
      }

      // Check if the error has the specific format with errors object
      if (error.errors) {
        if (error.errors.email && error.errors.email.length > 0) {
          errorMsg = error.errors.email[0];
        } else {
          // If there are other field errors, join them
          const errorMessages = Object.values(error.errors).flat();
          if (errorMessages.length > 0) {
            errorMsg = errorMessages[0] as string;
          }
        }
      }

      setErrorMessage(errorMsg);
      setShowErrorToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSignUpForm = () => {
    setSignUpData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  // Auto-hide success toast after 4 seconds
  React.useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // Auto-hide error toast after 5 seconds
  React.useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 max-w-md">
            <div className="bg-white/20 rounded-full p-2">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="font-semibold">{successMessage}</p>
              <p className="text-green-100 text-sm">Connexion en cours...</p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 max-w-md">
            <div className="bg-white/20 rounded-full p-2">
              <X size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Erreur</p>
              <p className="text-red-100 text-sm">{errorMessage}</p>
            </div>
            <button
              onClick={() => setShowErrorToast(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="glass-effect border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-3 shadow-lg">
                  <Zap size={28} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-1">
                  <Sparkles size={12} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">GDPilia</h1>
                <p className="text-sm text-slate-600 font-medium">CRM Alimenté par IA</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSignIn(true)}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t('signIn')}
              </button>
              <button
                onClick={() => setShowSignUp(true)}
                className="btn-primary"
              >
                {t('getStarted')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-pink-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full px-6 py-2 mb-8">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-blue-800 font-semibold text-sm">Plateforme CRM Alimentée par IA</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6">
              {t('heroTitle')}
              <span className="text-gradient block">{t('heroSubtitle')}</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => setShowSignUp(true)}
                className="btn-primary text-lg px-8 py-4 flex items-center space-x-2"
              >
                <span>{t('startFreeTrial')}</span>
                <ArrowRight size={20} />
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                {t('watchDemo')}
              </button>
            </div>
            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-slate-500">
              <div className="flex items-center space-x-2">
                <Check size={16} className="text-green-500" />
                <span>{t('freeTrial')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check size={16} className="text-green-500" />
                <span>{t('noCreditCard')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check size={16} className="text-green-500" />
                <span>{t('cancelAnytime')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              {t('featuresTitle')} <span className="text-gradient">{t('featuresSubtitle')}</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('featuresDescription')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="glass-effect rounded-2xl p-8 card-hover">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              {t('testimonialsTitle')} <span className="text-gradient">{t('testimonialsSubtitle')}</span>
            </h2>
            <p className="text-xl text-slate-600">{t('testimonialsDescription')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-effect rounded-2xl p-8 card-hover">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              {t('pricingTitle')} <span className="text-gradient">{t('pricingSubtitle')}</span>
            </h2>
            <p className="text-xl text-slate-600">{t('pricingDescription')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`glass-effect rounded-2xl p-8 card-hover relative ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {t('mostPopular')}
                    </div>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 ml-2">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowSignUp(true)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'btn-primary'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t('getStarted')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-effect rounded-3xl p-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              {t('ctaTitle')} <span className="text-gradient">{t('ctaSubtitle')}</span> {t('ctaEnd')}
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              {t('ctaDescription')}
            </p>
            <button
              onClick={() => setShowSignUp(true)}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 mx-auto"
            >
              <span>{t('startFreeTrial')}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-3">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">GDPilia</h3>
                <p className="text-slate-400">CRM Alimenté par IA</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-slate-400">
              <span>© 2024 GDPilia. Tous droits réservés.</span>
              <Globe size={20} />
            </div>
          </div>
        </div>
      </footer>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900">{t('welcomeBackTitle')}</h3>
              <button
                onClick={() => setShowSignIn(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('email')} *</label>
                <input
                  type="email"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  onBlur={(e) => {
                    if (e.target.value && !validateEmail(e.target.value)) {
                      e.target.setCustomValidity('Format d\'email invalide');
                    } else {
                      e.target.setCustomValidity('');
                    }
                  }}
                  className="input-modern"
                  placeholder="Entrez votre adresse email"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('password')} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    className="input-modern pr-12"
                    placeholder="Entrez votre mot de passe"
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : t('signIn')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <span className="text-slate-600">{t('dontHaveAccount')} </span>
              <button
                onClick={() => {
                  setShowSignIn(false);
                  setShowSignUp(true);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('signUp')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900">{t('createAccount')}</h3>
              <button
                onClick={() => setShowSignUp(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('firstName')} *</label>
                  <input
                    type="text"
                    value={signUpData.firstName}
                    onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                    className="input-modern"
                    placeholder="Votre prénom"
                    required
                    minLength={2}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('lastName')} *</label>
                  <input
                    type="text"
                    value={signUpData.lastName}
                    onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                    className="input-modern"
                    placeholder="Votre nom"
                    required
                    minLength={2}
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('email')} *</label>
                <input
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  onBlur={(e) => {
                    if (e.target.value && !validateEmail(e.target.value)) {
                      e.target.setCustomValidity('Format d\'email invalide');
                    } else {
                      e.target.setCustomValidity('');
                    }
                  }}
                  className="input-modern"
                  placeholder="Votre adresse email professionnelle"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('password')} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    className="input-modern pr-12"
                    placeholder="Créez un mot de passe sécurisé (min. 6 caractères)"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('confirmPassword')} *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signUpData.confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSignUpData({ ...signUpData, confirmPassword: value });
                      if (value && value !== signUpData.password) {
                        e.target.setCustomValidity('Les mots de passe ne correspondent pas');
                      } else {
                        e.target.setCustomValidity('');
                      }
                    }}
                    className="input-modern pr-12"
                    placeholder="Confirmez votre mot de passe"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
              </div>
              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Création...' : t('createAccount')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <span className="text-slate-600">{t('alreadyHaveAccount')} </span>
              <button
                onClick={() => {
                  setShowSignUp(false);
                  setShowSignIn(true);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('signIn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
