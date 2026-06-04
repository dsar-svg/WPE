import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Asegúrate de que estas variables estén definidas en Vercel -> Settings -> Environment Variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. Validar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth Error:", authError);
      return res.status(401).json({ error: 'Invalid Token' });
    }

    // 3. Sincronización
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error("Supabase Create Error:", createError);
      return res.status(500).json({ error: createError.message });
    }

    return res.status(200).json({ status: 'created', uid: newUser.user?.id });

  } catch (err: any) {
    // ESTO ES LO QUE VERÁS EN LOS LOGS DE VERCEL SI TODO FALLA
    console.error("CATCH ERROR:", err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
