import { supabase } from './supabaseClient';

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  position: 'hero' | 'sidebar' | 'footer';
  target_audience: 'all' | 'guests' | 'users' | 'admins';
  start_date: string;
  end_date?: string;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_active: boolean;
  target_audience: 'all' | 'admins' | 'users';
  auto_dismiss: boolean;
  dismiss_after: number;
  created_at: string;
  updated_at: string;
}

interface SiteSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
  is_public: boolean;
  updated_at: string;
}

class ContentService {
 
  async getContentPages(): Promise<ContentPage[]> {
    const { data, error } = await supabase
      .from('content_pages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getContentPageBySlug(slug: string): Promise<ContentPage | null> {
    const { data, error } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createContentPage(page: Omit<ContentPage, 'id' | 'created_at' | 'updated_at'>): Promise<ContentPage> {
    const { data, error } = await supabase
      .from('content_pages')
      .insert(page)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateContentPage(id: string, updates: Partial<ContentPage>): Promise<ContentPage> {
    const { data, error } = await supabase
      .from('content_pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteContentPage(id: string): Promise<void> {
    const { error } = await supabase
      .from('content_pages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  
  async getBanners(): Promise<Banner[]> {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getActiveBanners(position?: string): Promise<Banner[]> {
    let query = supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString());

    if (position) {
      query = query.eq('position', position);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createBanner(banner: Omit<Banner, 'id' | 'click_count' | 'view_count' | 'created_at' | 'updated_at'>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .insert(banner)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateBanner(id: string, updates: Partial<Banner>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async incrementBannerClick(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .update({ 
        click_count: supabase.sql`click_count + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  }

  async incrementBannerView(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .update({ 
        view_count: supabase.sql`view_count + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  }

 
  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getActiveNotifications(targetAudience: 'all' | 'admins' | 'users' = 'all'): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .in('target_audience', ['all', targetAudience])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteNotification(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

 
  async getSiteSettings(): Promise<SiteSetting[]> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getPublicSiteSettings(): Promise<SiteSetting[]> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('is_public', true)
      .order('category', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getSiteSetting(key: string): Promise<SiteSetting | null> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async updateSiteSetting(key: string, value: any, description?: string): Promise<SiteSetting> {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteSiteSetting(key: string): Promise<void> {
    const { error } = await supabase
      .from('site_settings')
      .delete()
      .eq('key', key);
    
    if (error) throw error;
  }
}

export const contentService = new ContentService();