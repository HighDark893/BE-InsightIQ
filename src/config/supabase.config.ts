import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Xác định đường dẫn đến file .env
const envPath = path.resolve(__dirname, '../../.env');

// Load biến môi trường
const configOutput = dotenv.config({ path: envPath });

if (configOutput.error) {
  console.warn(`[Supabase Config] Error loading .env file from ${envPath}:`, configOutput.error.message);
  console.warn('[Supabase Config] Attempting to use environment variables directly.');
} else if (configOutput.parsed) {
    console.log(`[Supabase Config] Loaded environment variables from ${envPath}`);
}

// Lấy URL và các Keys
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Vẫn thử lấy Anon Key
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY; // Lấy Service Role Key

// Kiểm tra URL
if (!supabaseUrl) {
  throw new Error('Supabase URL not found (SUPABASE_URL). Check .env file or environment variables.');
}

// Biến để lưu key sẽ sử dụng
let supabaseKey: string | undefined = undefined;
let keyType: string = '';

// Ưu tiên dùng Anon Key nếu có
if (supabaseAnonKey) {
    supabaseKey = supabaseAnonKey;
    keyType = 'Anon Key';
}
// Nếu không có Anon Key, dùng Service Role Key
else if (supabaseServiceRoleKey) {
    supabaseKey = supabaseServiceRoleKey;
    keyType = 'Service Role Key';
}
// Nếu không có key nào thì báo lỗi
else {
    throw new Error('Neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_KEY found. Check .env file or environment variables.');
}

// Tạo Supabase client instance với key đã chọn
let supabase: SupabaseClient;
try {
    supabase = createClient(supabaseUrl, supabaseKey); // Dùng key đã chọn
    console.log(`[Supabase Config] Supabase client created successfully using ${keyType}.`);
} catch (error) {
     console.error('[Supabase Config] Error creating Supabase client:', error);
     throw new Error('Failed to create Supabase client.');
}

// Export client mặc định
export { supabase };
