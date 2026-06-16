/**
 * Seed script: creates the SCIENTIA AI superadmin user in Supabase Auth
 * and a corresponding DB record.
 *
 * Run once:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-superadmin.ts
 *
 * Credentials:
 *   Email:    superadmin@scientia.ai
 *   Password: Scientia@Admin2026!
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const prisma = new PrismaClient();

  const email = 'superadmin@scientia.ai';
  const password = 'Scientia@Admin2026!';

  console.log('Creating superadmin in Supabase Auth...');

  // Create user in Supabase Auth (service role bypasses email confirmation)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Super Admin',
      role: 'superadmin',
    },
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists in Supabase Auth — skipping create.');
    } else {
      throw authError;
    }
  }

  const supabaseId = authData?.user?.id ?? (
    // If already exists, list users to get the ID
    await supabase.auth.admin.listUsers().then(({ data }) =>
      data.users.find(u => u.email === email)?.id
    )
  );

  if (!supabaseId) throw new Error('Could not resolve supabaseId for superadmin');

  console.log(`Supabase user ID: ${supabaseId}`);

  // Upsert in DB
  const user = await prisma.user.upsert({
    where: { supabaseId },
    create: {
      supabaseId,
      email,
      fullName: 'Super Admin',
    },
    update: { email, fullName: 'Super Admin' },
  });

  console.log(`DB user created/updated: ${user.id}`);
  console.log('\n✅ Superadmin pronto!');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   DB ID:    ${user.id}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
