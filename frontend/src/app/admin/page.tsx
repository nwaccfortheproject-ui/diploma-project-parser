import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  
  await connectToDatabase();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Зарегистрированные пользователи</h1>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-700">Имя</th>
              <th className="p-4 font-semibold text-gray-700">Email</th>
              <th className="p-4 font-semibold text-gray-700">Дата регистрации</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user._id.toString()} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-800">{user.name || 'Нет имени'}</td>
                <td className="p-4 text-gray-600">{user.email}</td>
                <td className="p-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">Пользователей пока нет.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
