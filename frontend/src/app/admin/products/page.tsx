"use client";

import { useState, useEffect } from 'react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?page=${p}&limit=20`);
      const data = await res.json();
      if(data.items) {
        setProducts(data.items);
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    if(!confirm("Вы уверены что хотите удалить данный товар?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if(res.ok) {
        setProducts(prev => prev.filter(p => (p.id || p._id) !== id));
      } else {
        alert("Ошибка удаления");
      }
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Управление товарами</h1>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-700 w-16">Фото</th>
              <th className="p-4 font-semibold text-gray-700">Бренд</th>
              <th className="p-4 font-semibold text-gray-700">Название</th>
              <th className="p-4 font-semibold text-gray-700">Артикул</th>
              <th className="p-4 font-semibold text-gray-700 w-24 text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-12 text-center text-gray-500 animate-pulse">Загрузка каталога...</td></tr>
            ) : products.map((product: any) => (
              <tr key={product.id || product._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  {product.images?.[0] ? 
                    <img src={product.images[0]} alt="" className="w-12 h-12 object-cover rounded shadow-sm border border-gray-200" /> : 
                    <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-xs">Нет</div>}
                </td>
                <td className="p-4 font-medium text-gray-900">{product.brand}</td>
                <td className="p-4 text-gray-700">{product.title}</td>
                <td className="p-4 text-gray-500 font-mono text-xs">{product.article}</td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleDelete(product.id || product._id)} 
                    className="text-red-500 hover:text-white hover:bg-red-500 border border-red-500 transition-colors px-3 py-1 rounded text-xs font-medium"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && !loading && (
               <tr><td colSpan={5} className="p-8 text-center text-gray-500">Товары не найдены</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center">
         <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-white border border-gray-300 rounded font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm text-gray-700 shadow-sm">Назад</button>
         <span className="text-sm font-medium text-gray-500">Страница {page}</span>
         <button onClick={() => setPage(page + 1)} className="px-4 py-2 bg-white border border-gray-300 rounded font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm text-gray-700 shadow-sm">Вперед</button>
      </div>
    </div>
  );
}
