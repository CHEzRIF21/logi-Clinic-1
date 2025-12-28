/**
 * @deprecated Utilisez server/src/config/supabase.ts à la place
 * Ce fichier est conservé pour compatibilité mais sera supprimé dans une future version
 */
import { supabase as newSupabase } from './config/supabase';

export { newSupabase as supabase };
export default newSupabase;

