import { redirect } from 'next/navigation'

export default function RootPage() {
  // This forces Next.js to handle the routing properly 
  // without getting lost in the (dashboard) group
  redirect('/login')
}
