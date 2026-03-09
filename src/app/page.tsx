import { redirect } from 'next/navigation'

export default function RootPage() {
  // This is the "Magic Bridge"
  // It sends users from / to the dashboard logic sitting in (dashboard)
  redirect('/')
}
