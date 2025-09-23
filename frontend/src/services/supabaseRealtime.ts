// Supabase Real-time Data Service
import { supabase, Project, Quote } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export class SupabaseRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to projects real-time updates
  subscribeToProjects(
    userId: string, 
    userRole: string,
    callback: (projects: Project[]) => void
  ): RealtimeSubscription {
    const channelName = `projects_${userId}`;
    
    // Remove existing channel if any
    this.unsubscribeFromChannel(channelName);

    // Create new channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: userRole === 'admin' || userRole === 'sales' 
            ? undefined 
            : `user_id=eq.${userId}`
        },
        () => {
          // Fetch updated projects
          this.fetchProjects(userId, userRole).then(callback);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Initial fetch
    this.fetchProjects(userId, userRole).then(callback);

    return {
      unsubscribe: () => this.unsubscribeFromChannel(channelName)
    };
  }

  // Subscribe to quotes real-time updates
  subscribeToQuotes(
    userId: string,
    userRole: string,
    callback: (quotes: Quote[]) => void
  ): RealtimeSubscription {
    const channelName = `quotes_${userId}`;
    
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: userRole === 'admin' || userRole === 'sales' 
            ? undefined 
            : `user_id=eq.${userId}`
        },
        () => {
          this.fetchQuotes(userId, userRole).then(callback);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Initial fetch
    this.fetchQuotes(userId, userRole).then(callback);

    return {
      unsubscribe: () => this.unsubscribeFromChannel(channelName)
    };
  }

  // Subscribe to user presence (simplified version)
  subscribeToUserPresence(callback: (users: any[]) => void): RealtimeSubscription {
    const channelName = 'user_presence';
    
    this.unsubscribeFromChannel(channelName);

    const channel = supabase.channel(channelName);
    
    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        callback(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user presence
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    this.channels.set(channelName, channel);

    return {
      unsubscribe: () => this.unsubscribeFromChannel(channelName)
    };
  }

  // Subscribe to notifications
  subscribeToNotifications(
    userId: string,
    callback: (notifications: any[]) => void
  ): RealtimeSubscription {
    const channelName = `notifications_${userId}`;
    
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          this.fetchNotifications(userId).then(callback);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Initial fetch
    this.fetchNotifications(userId).then(callback);

    return {
      unsubscribe: () => this.unsubscribeFromChannel(channelName)
    };
  }

  // Create new project with real-time notification
  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) throw error;

    // Send notification to sales team
    await this.sendNotificationToRole('sales', {
      title: 'New Project Inquiry',
      message: `New project: ${projectData.title}`,
      type: 'info',
      data: { project_id: data.id }
    });

    return data;
  }

  // Update project with real-time notification
  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    // Notify project owner if status changed
    if (updates.status) {
      await this.sendNotification(data.user_id, {
        title: 'Project Update',
        message: `Your project "${data.title}" status changed to ${updates.status}`,
        type: 'info',
        data: { project_id: projectId }
      });
    }

    return data;
  }

  // Create quote with notification
  async createQuote(quoteData: Omit<Quote, 'id' | 'created_at' | 'updated_at'>): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .insert(quoteData)
      .select()
      .single();

    if (error) throw error;

    // Notify project owner
    await this.sendNotification(quoteData.user_id, {
      title: 'New Quote Available',
      message: `You have received a quote for $${quoteData.amount}`,
      type: 'success',
      data: { quote_id: data.id, project_id: quoteData.project_id }
    });

    return data;
  }

  // Send notification to specific user
  async sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    data?: any;
  }): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        ...notification
      });

    if (error) throw error;
  }

  // Send notification to all users with specific role
  async sendNotificationToRole(role: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    data?: any;
  }): Promise<void> {
    // Get all users with the specified role
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', role);

    if (error) throw error;

    // Send notification to each user
    const notifications = users.map(user => ({
      user_id: user.id,
      ...notification
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) throw insertError;
  }

  // Mark notification as read
  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Private helper methods
  private async fetchProjects(userId: string, userRole: string): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select(`
        *,
        assigned_user:assigned_to(full_name),
        owner:user_id(full_name)
      `)
      .order('created_at', { ascending: false });

    // Filter based on user role
    if (userRole === 'customer') {
      query = query.eq('user_id', userId);
    } else if (userRole === 'sales') {
      query = query.or(`user_id.eq.${userId},assigned_to.eq.${userId}`);
    }
    // Admin sees all projects (no filter)

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async fetchQuotes(userId: string, userRole: string): Promise<Quote[]> {
    let query = supabase
      .from('quotes')
      .select(`
        *,
        project:project_id(title, user_id)
      `)
      .order('created_at', { ascending: false });

    // Filter based on user role
    if (userRole === 'customer') {
      query = query.eq('user_id', userId);
    }
    // Sales and admin see all quotes

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async fetchNotifications(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  private unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

// Export singleton instance
export const realtimeService = new SupabaseRealtimeService();
