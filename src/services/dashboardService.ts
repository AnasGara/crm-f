import { httpClient, ApiResponse } from './api';

// Dashboard stats types based on your API response
export interface UpcomingTask {
  id: number;
  title: string;
  due_date: string;
  assignee?: string; 
}

export interface DashboardStats {
  organisation_users: number;
  opportunities_count: number;
  opportunities_by_stage: Record<string, number>;
  pipeline_value: string;
  pending_tasks_count: number;
  tasks_overdue: number;
  task_priorities: Record<string, number>;
  upcoming_tasks: {
    assignee: string; id: number; title: string; due_date: string 
}[];
  appointments_today: number;
  contacts_count: number;
  monthly_new_contacts: number;
}

// Dashboard service class
class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await httpClient.get<DashboardStats>('/dashboard/stats');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch dashboard stats');
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  /**
   * Get formatted stats for display
   */
  async getFormattedStats(): Promise<{
    totalUsers: string;
    totalTasks: string;
    totalOpportunities: string;
    upcomingTasks: UpcomingTask[];
  }> {
    try {
      const stats = await this.getDashboardStats();
      
      return {
        totalUsers: stats.organisation_users.toLocaleString(),
        totalTasks: stats.organisation_users.toLocaleString(),
        totalOpportunities: stats.opportunities_count.toLocaleString(),
        upcomingTasks: stats.upcoming_tasks,
      };
    } catch (error) {
      console.error('Get formatted stats error:', error);
      throw error;
    }
  }
}

// Create and export service instance
export const dashboardService = new DashboardService();

// Export for convenience
export default dashboardService;