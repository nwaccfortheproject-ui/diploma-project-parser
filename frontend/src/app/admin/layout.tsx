import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-bold">SMARTBUY Админка</h2>
        </div>
        <nav className="space-y-1 p-4">
          <Link href="/admin" className="block px-4 py-2 rounded text-gray-700 hover:bg-gray-100">Пользователи</Link>
          <Link href="/admin/products" className="block px-4 py-2 rounded text-gray-700 hover:bg-gray-100">Товары</Link>
          <Link href="/" className="block px-4 py-2 rounded text-gray-500 hover:bg-gray-100 mt-8">Вернуться на сайт</Link>
          <LogoutButton className="block w-full text-left px-4 py-2 rounded text-red-500 font-medium hover:bg-red-50" />
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
