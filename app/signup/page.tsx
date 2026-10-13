import { redirect } from 'next/navigation';

// Email codes create accounts, so sign-up and sign-in are one page.
export default function SignupPage() {
  redirect('/login');
}
