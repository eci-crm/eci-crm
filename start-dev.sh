#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_D5KcnuZLVX9d@ep-red-cell-a4ps8e2n.us-east-1.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://neondb_owner:npg_D5KcnuZLVX9d@ep-red-cell-a4ps8e2n.us-east-1.aws.neon.tech/neondb?sslmode=require"
exec node ./node_modules/.bin/next dev -p 3000
