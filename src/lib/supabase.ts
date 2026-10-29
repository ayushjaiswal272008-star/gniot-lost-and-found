import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Project credentials (can be overridden via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars)
const DEFAULT_SUPABASE_URL = 'https://yvdztwjlikuzozkhplcb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Pe4q1amclemMHvOh2octDg_wCXGNVQa';

// Safe environment variable retrieval with project fallback
const rawUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL 
  ? String(import.meta.env.VITE_SUPABASE_URL).trim() 
  : '';
const rawKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY 
  ? String(import.meta.env.VITE_SUPABASE_ANON_KEY).trim() 
  : '';

const envUrl = rawUrl && rawUrl.startsWith('https://') ? rawUrl : DEFAULT_SUPABASE_URL;
const envAnonKey = rawKey && rawKey.length > 15 ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

// Validation: check if Supabase URL and Key are provided
export const isSupabaseConfigured: boolean = Boolean(
  envUrl &&
  envAnonKey &&
  envUrl.startsWith('https://') &&
  envAnonKey.length > 15
);

export const supabaseUrl = envUrl;
export const supabaseAnonKey = envAnonKey;

// Single unified Supabase client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(envUrl, envAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null;

/**
 * Actively tests the live Supabase database connection.
 * Performs a lightweight head query on campus_locations or reports.
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Supabase configuration missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or GitHub Secrets.',
    };
  }

  try {
    const { error } = await supabase
      .from('campus_locations')
      .select('id', { count: 'exact', head: true });

    if (error) {
      // If table doesn't exist yet, try reports or basic auth probe
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('not found')) {
        return {
          connected: true,
          message: 'Connected to Supabase project, but database tables are not yet created. Please run the SQL migration in Supabase SQL Editor.',
        };
      }
      return {
        connected: false,
        message: `Supabase query returned error: ${error.message}`,
        error: error.message,
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to live Supabase PostgreSQL database!',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect to Supabase: ${err.message || 'Network error'}`,
      error: err.message,
    };
  }
}

/**
 * Uploads an item photograph to Supabase Storage bucket 'item-images'.
 * Generates a safe unique path based on user/timestamp.
 * Falls back to base64 if bucket is unavailable.
 */
export async function uploadItemImage(
  file: File,
  userId?: string
): Promise<{ url: string; path?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    // Fallback: convert to base64 data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ url: reader.result as string });
      reader.onerror = () => resolve({ url: '', error: 'Failed to read image file' });
      reader.readAsDataURL(file);
    });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { url: '', error: 'Image file size must be less than 5MB' };
  }

  // Validate mime type
  if (!file.type.startsWith('image/')) {
    return { url: '', error: 'Only image files (JPG, PNG, WebP) are allowed' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const safeExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${userId || 'guest'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${safeExt}`;
    const filePath = `items/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase Storage upload warning (falling back to base64):', uploadError.message);
      // Fallback to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ url: reader.result as string });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
    };
  } catch (err: any) {
    console.warn('Storage upload error, using local fallback:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ url: reader.result as string });
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Uploads ownership verification evidence (receipt, serial number photo, proof document)
 * to private Supabase Storage bucket 'claim-evidence'.
 */
export async function uploadClaimEvidence(
  file: File,
  claimId: string,
  userId?: string
): Promise<{ url: string; path?: string; fileName: string; fileType: string; error?: string }> {
  const fileName = file.name || 'evidence-document';
  const fileType = file.type || 'image/jpeg';

  if (!isSupabaseConfigured || !supabase) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        url: reader.result as string,
        fileName,
        fileType
      });
      reader.onerror = () => resolve({ url: '', fileName, fileType, error: 'Failed to read file' });
      reader.readAsDataURL(file);
    });
  }

  // Validate file size (max 10MB for documents/receipts)
  if (file.size > 10 * 1024 * 1024) {
    return { url: '', fileName, fileType, error: 'Evidence file must be smaller than 10MB' };
  }

  try {
    const fileExt = fileName.split('.').pop() || 'jpg';
    const safeExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPath = `claims/${claimId}/${userId || 'claimant'}_${Date.now()}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from('claim-evidence')
      .upload(cleanPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.warn('claim-evidence bucket upload fallback to dataURL:', uploadError.message);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
          url: reader.result as string,
          fileName,
          fileType
        });
        reader.readAsDataURL(file);
      });
    }

    // Generate signed URL with 7 days validity for authorized access
    const { data: signedData, error: signError } = await supabase.storage
      .from('claim-evidence')
      .createSignedUrl(cleanPath, 60 * 60 * 24 * 7);

    if (signError || !signedData?.signedUrl) {
      const { data: pubData } = supabase.storage.from('claim-evidence').getPublicUrl(cleanPath);
      return {
        url: pubData.publicUrl,
        path: cleanPath,
        fileName,
        fileType
      };
    }

    return {
      url: signedData.signedUrl,
      path: cleanPath,
      fileName,
      fileType
    };
  } catch (err: any) {
    console.warn('Storage upload exception, fallback to base64:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        url: reader.result as string,
        fileName,
        fileType
      });
      reader.readAsDataURL(file);
    });
  }
}

