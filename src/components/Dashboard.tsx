import React, { useState } from 'react';
import { Users, Target, CheckSquare, TrendingUp, DollarSign, Clock, ArrowUpRight, Sparkles, Zap, Plus, X, Building, Mail, Phone, MapPin, Calendar, User, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/authService';
import { dashboardService, DashboardStats, UpcomingTask } from '../services/dashboardService';
import { useOrganization } from '../contexts/OrganizationContext';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  status: 'hot' | 'warm' | 'cold';
}

interface Opportunity {
  id: number;
  title: string;
  company: string;
  value: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  closeDate: string;
  contact: string;
  description: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  assignee: string;
  relatedTo: string;
  type: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
}

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { currentOrganization } = useOrganization();
  
  // Get user data from auth service
  const currentUser = authService.getStoredUser();
  const userDisplayName = authService.getUserDisplayName();
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // Modal states
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showCreateOpportunityModal, setShowCreateOpportunityModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Form data states
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    location: '',
    status: 'warm' as 'hot' | 'warm' | 'cold',
  });

  const [opportunityFormData, setOpportunityFormData] = useState({
    title: '',
    company: '',
    value: '',
    stage: 'prospecting' as Opportunity['stage'],
    probability: '',
    closeDate: '',
    contact: '',
    description: '',
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'pending' as Task['status'],
    dueDate: '',
    assignee: '',
    relatedTo: '',
    type: 'other' as Task['type'],
  });

  // Load dashboard stats on component mount and when organization changes
  React.useEffect(() => {
    if (currentOrganization) {
      loadDashboardStats();
    } else {
      setDashboardStats(null);
      setStatsLoading(false);
    }
  }, [currentOrganization]);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const stats = await dashboardService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setStatsError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const retryLoadStats = () => {
    setStatsError(null);
    loadDashboardStats();
  };

  // Generate stats array from API data
 const getStatsArray = () => {
  if (!dashboardStats) return [];

  return [
    {
      title: 'Total des Utilisateurs',
      value: (dashboardStats.organisation_users ?? 0).toLocaleString(),
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
    },
    {
      title: t('activeOpportunities'),
      value: (dashboardStats.opportunities_count ?? 0).toLocaleString(),
      change: '+8%',
      changeType: 'positive',
      icon: Target,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
    },
    {
      title: 'Total des Tâches',
      value: (dashboardStats.pending_tasks_count ?? 0).toLocaleString(),
      change: '',
      changeType: '',
      icon: CheckSquare,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
    },
    {
      title: 'Tâches à Venir',
      value: (dashboardStats.upcoming_tasks?.length ?? 0).toString(),
      change: '+15%',
      changeType: 'positive',
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
    },
  ];
};


  const recentActivities = [
    {
      id: 1,
      type: 'contact',
      title: 'New contact added',
      description: 'Sarah Johnson from TechCorp',
      time: '2 hours ago',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      type: 'opportunity',
      title: 'Deal moved to negotiation',
      description: 'Enterprise Software License - $50k',
      time: '4 hours ago',
      icon: Target,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 3,
      type: 'task',
      title: 'Follow-up call completed',
      description: 'Called ProSoft Ltd regarding proposal',
      time: '1 day ago',
      icon: CheckSquare,
      color: 'from-orange-500 to-amber-500',
    },
    {
      id: 4,
      type: 'opportunity',
      title: 'New opportunity created',
      description: 'Cloud Migration Services - $120k',
      time: '2 days ago',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const pipelineStages = [
    { stage: 'Prospecting', count: 45, amount: '$230k', color: 'from-slate-400 to-slate-500', progress: 20 },
    { stage: 'Qualification', count: 32, amount: '$180k', color: 'from-blue-400 to-blue-500', progress: 35 },
    { stage: 'Proposal', count: 18, amount: '$290k', color: 'from-yellow-400 to-orange-500', progress: 60 },
    { stage: 'Negotiation', count: 12, amount: '$340k', color: 'from-emerald-400 to-emerald-500', progress: 80 },
    { stage: 'Closed Won', count: 8, amount: '$160k', color: 'from-green-400 to-green-500', progress: 100 },
  ];

  // Reset form functions
  const resetContactForm = () => {
    setContactFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      location: '',
      status: 'warm',
    });
  };

  const resetOpportunityForm = () => {
    setOpportunityFormData({
      title: '',
      company: '',
      value: '',
      stage: 'prospecting',
      probability: '',
      closeDate: '',
      contact: '',
      description: '',
    });
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      assignee: '',
      relatedTo: '',
      type: 'other',
    });
  };

  // Handle form submissions
  const handleAddContact = () => {
    if (!contactFormData.name || !contactFormData.email) return;

    // Here you would typically save to your data store
    console.log('Adding contact:', contactFormData);
    
    // Show success message (you could implement a toast notification)
    alert('Contact added successfully!');
    
    resetContactForm();
    setShowAddContactModal(false);
  };

  const handleCreateOpportunity = () => {
    if (!opportunityFormData.title || !opportunityFormData.company || !opportunityFormData.value) return;

    // Here you would typically save to your data store
    console.log('Creating opportunity:', opportunityFormData);
    
    // Show success message
    alert('Opportunity created successfully!');
    
    resetOpportunityForm();
    setShowCreateOpportunityModal(false);
  };

  const handleAddTask = () => {
    if (!taskFormData.title || !taskFormData.dueDate) return;

    // Here you would typically save to your data store
    console.log('Adding task:', taskFormData);
    
    // Show success message
    alert('Task added successfully!');
    
    resetTaskForm();
    setShowAddTaskModal(false);
  };
  // Show loading state if no organization
  if (!currentOrganization) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden glass-effect rounded-3xl p-8 border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-pink-600/10"></div>
          <div className="relative text-center">
            <Building size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune organisation</h3>
            <p className="text-gray-600">Vous devez être membre d'une organisation pour voir le tableau de bord.</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden glass-effect rounded-3xl p-8 border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-pink-600/10"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Bon retour, {userDisplayName} ! 👋
            </h1>
            <p className="text-slate-600 text-lg">{t('welcomeDescription')}</p>
            {currentUser && (
              <div className="mt-4 flex items-center space-x-4 text-sm text-slate-500">
                <span>📧 {currentUser.email}</span>
                {currentUser.organisation_id && (
                  <span>🏢 Organisation #{currentUser.organisation_id}</span>
                )}
                <span>📅 Membre depuis {new Date(currentUser.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center animate-float">
                <Zap size={40} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-2 animate-pulse">
                <Sparkles size={16} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center space-x-3">
          <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 mb-1">Erreur de chargement des statistiques</h4>
            <p className="text-red-700">{statsError}</p>
          </div>
          <button
            onClick={retryLoadStats}
            className="text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-red-100"
          >
            <RefreshCw size={16} />
            <span>Réessayer</span>
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          // Loading skeleton
          [...Array(4)].map((_, index) => (
            <div key={index} className="metric-card group animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-2xl bg-gray-200 w-16 h-16"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          getStatsArray().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="metric-card group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={28} className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`text-sm font-bold ${
                    stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {/*  {stat.change}  */}
                  </span>
                  {/*  <ArrowUpRight size={16} className={stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-500 rotate-90'} />  */} 
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-2">Live stats</p>
              </div>
            </div>
          );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pipeline Overview 
        <div className="glass-effect rounded-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('salesPipeline')}</h3>
              <p className="text-slate-600">Track your deals through each stage</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="space-y-6">
            {pipelineStages.map((stage, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${stage.color}`}></div>
                    <span className="font-semibold text-slate-900">{stage.stage}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{stage.amount}</div>
                    <div className="text-sm text-slate-500">{stage.count} deals</div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stage.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${stage.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
 */}
        {/* Upcoming Tasks */}
        <div className="glass-effect rounded-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Tâches à Venir</h3>
              <p className="text-slate-600">Restez au courant de vos prochaines échéances</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
              <Clock size={24} className="text-emerald-600" />
            </div>
          </div>
          
          {statsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-xl animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-48 h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="w-20 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardStats && dashboardStats.upcoming_tasks.length > 0 ? (
            <div className="space-y-4">
              {dashboardStats.upcoming_tasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-slate-50/50 transition-colors group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-110 transition-transform">
                    <CheckSquare size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{task.title}</p>
                    <p className="text-slate-600 mt-1">  Assigné à {task.assignee ?? "N/A"} </p>
                    <p className="text-xs text-slate-500 mt-2 flex items-center">
                      <Calendar size={12} className="mr-1" />
                      Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium">Aucune tâche à venir</p>
              <p className="text-gray-400 text-sm">Toutes vos tâches sont à jour !</p>
            </div>
          )}
        </div>
      </div>

     
    </div>
  );
};

export default Dashboard;