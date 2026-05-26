import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductGallery } from '@/components/product-gallery';
import { Product } from '@/types';
import { Types } from 'mongoose';
import connectToDatabase from '@/lib/db';
import ProductModel from '@/models/Product';
import { ProductActions } from '@/components/product/product-actions';
import { UserMenu } from '@/components/auth/user-menu';
import { ShoppingBag } from 'lucide-react';

async function getProduct(id: string): Promise<Product | undefined> {
    try {
        await connectToDatabase();

        const query = Types.ObjectId.isValid(id) ? { _id: id } : { article: id };
        const doc = await ProductModel.findOne(query).lean<Record<string, unknown> & { _id: Types.ObjectId }>();
        if (!doc) return undefined;

        const { _id, __v: _v, ...rest } = doc;
        return { ...rest, id: _id.toString() } as Product;
    } catch {
        return undefined;
    }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    const currentPrice = product.discount_price || product.price;

    return (
        <div className="min-h-screen bg-white">
            <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold tracking-tighter text-lg">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                        <span>SMARTBUY</span>
                    </Link>
                    <UserMenu />
                </div>
            </header>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href="/products" className="text-sm text-gray-500 hover:text-black">
                        ← Назад к каталогу
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image Gallery */}
                    {/* Image Gallery */}
                    <ProductGallery images={product.images} title={product.title || 'Product'} />

                    {/* Details */}
                    <div>
                        <div className="mb-4">
                            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-widest">{product.brand}</h2>
                            <h1 className="text-3xl font-bold mt-2 text-gray-900">{product.title}</h1>
                        </div>

                        <div className="flex items-baseline gap-4 mb-8">
                            <span className="text-2xl font-bold">{currentPrice}</span>
                            {product.discount_price && (
                                <span className="text-lg text-gray-400 line-through">{product.price}</span>
                            )}
                        </div>



                        <ProductActions product={product} />

                        {/* Description */}
                        <div className="prose prose-sm text-gray-600">
                            <h3 className="text-gray-900 font-medium pb-2 border-b">Details</h3>
                            <dl className="mt-4 space-y-2">
                                {product.composition && (
                                    <div className="flex justify-between">
                                        <dt>Composition</dt>
                                        <dd className="font-medium text-gray-900">{product.composition}</dd>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <dt>Article</dt>
                                    <dd>{product.article}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt>Gender</dt>
                                    <dd>{product.gender}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
