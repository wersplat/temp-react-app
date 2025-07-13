# Database Scripts

This directory contains scripts for managing the database, including seeding and maintenance tasks.

## Available Scripts

### 1. `seed-database.js`
The main script for seeding the database with sample data.

**Prerequisites:**
- Node.js environment
- Environment variables set in `.env` file:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_SERVICE_ROLE_KEY`

**Usage:**
```bash
# Run the seed script
npm run seed

# Or directly with node
node scripts/seed-database.js
```

### 2. `seed-supabase-sql.sql`
Pure SQL script for seeding the database. Can be run directly in the Supabase SQL editor.

**Usage:**
1. Copy the contents of this file
2. Open Supabase SQL Editor (https://app.supabase.com/project/[YOUR_PROJECT_REF]/sql)
3. Paste and run the script

### 3. `update-rls-policies.sql`
SQL script for managing Row Level Security (RLS) policies.

**Usage:**
1. Copy the contents of this file
2. Open Supabase SQL Editor
3. Paste and run the script

## Best Practices

1. **Backup your database** before running any scripts in production
2. Use the `seed-database.js` script for development and testing
3. For production, consider using the SQL scripts for more control
4. Always review the scripts before running them in production

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

- If you encounter permission issues, ensure your service role key has sufficient permissions
- For RLS issues, verify that the policies in `update-rls-policies.sql` are correctly configured
- Check the Supabase dashboard logs for detailed error messages
