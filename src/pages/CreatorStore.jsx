import React, { useEffect, useState } from "react";
import { ShoppingBag, BarChart3, Tag, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { ngnToUsd } from "@/lib/currency";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProductForm from "@/components/store/ProductForm";
import { money } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import PaymentModal from "@/components/app/PaymentModal";
import { AlertTriangle } from "lucide-react";

const typeColors = {
  merch: "bg-blue-500/15 text-blue-600", album: "bg-purple-500/15 text-purple-600",
  single: "bg-purple-500/15 text-purple-600", beat_pack: "bg-orange-500/15 text-orange-600",
  course: "bg-green-500/15 text-green-600", membership: "bg-primary/15 text-primary",
};

function CreatorStoreContent() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState(null);
  const { toast } = useToast();

  const loadProducts = () => xedruo.entities.Product.list("-created_date", 50).then(setProducts);
  const loadOrders = () => xedruo.entities.Order.list("-created_date", 50).then(setOrders);
  useEffect(() => { loadProducts(); loadOrders(); }, []);

  const onCreated = () => { setOpen(false); loadProducts(); };

  const confirmPurchase = async () => {
    const product = buyingProduct;
    await xedruo.entities.Order.create({ product_id: product.id, product_name: product.name, product_type: product.type, amount: product.price, currency: product.currency, status: "completed", buyer_name: "Buyer", buyer_email: "" });
    await xedruo.entities.Product.update(product.id, { sales: (product.sales || 0) + 1 });
    toast({ title: "Order placed!", description: `${product.name} purchased successfully.` });
    loadProducts(); loadOrders();
  };

  const remove = async (id) => { await xedruo.entities.Product.update(id, { status: "archived" }); loadProducts(); };

  const activeProducts = products.filter(p => p.status === "active");
  const totalRevenue = orders.reduce((a, o) => a + o.amount, 0);
  const commission = Math.round(totalRevenue * 0.1);

  return (
    <div>
      <PageHeader title="Creator Store" subtitle="Sell beats, merch, courses, and digital downloads." action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Product</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
            <ProductForm onCreated={onCreated} />
          </DialogContent>
        </Dialog>
      } />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={ShoppingBag} label="Active Products" value="0" />
        <StatCard icon={ShoppingCart} label="Total Orders" value="0" />
        <StatCard icon={BarChart3} label="Revenue" value="0" />
        <StatCard icon={Tag} label="Platform Fee (10%)" value="0" />
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-5">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeProducts.length === 0 && <div className="col-span-full p-10 text-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">No products yet. Add your first product to start selling.</div>}
            {activeProducts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <Badge className={`border-0 text-xs mt-1 capitalize ${typeColors[p.type] || "bg-muted text-muted-foreground"}`}>{p.type?.replace(/_/g, " ")}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                </div>
                {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <div className="font-bold">{money(p.price, p.currency)}</div>
                    {p.price > 0 && <div className="text-xs text-green-500">≈ ${ngnToUsd(p.price)}</div>}
                    <div className="text-xs text-muted-foreground">0 sold</div>
                  </div>
                  <Button size="sm" onClick={() => setBuyingProduct(p)}><ShoppingCart className="w-4 h-4 mr-1" />Buy</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {orders.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No orders yet.</div>}
            {orders.map((o) => (
              <div key={o.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{o.product_name}</div>
                  <div className="text-sm text-muted-foreground">{o.buyer_name} · {o.buyer_email} · {new Date(o.created_date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">0</div>
                  <div className="text-xs text-muted-foreground">You earn: 0</div>
                </div>
                <Badge className="border-0 bg-green-500/15 text-green-600 capitalize text-xs">{o.status}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-3">Revenue Breakdown</h3>
              <div className="space-y-2 text-sm">
                {["album", "beat_pack", "course", "merch", "membership", "digital_download"].map(type => {
                  const rev = products.filter(p => p.type === type).reduce((a, p) => a + (p.sales || 0) * p.price, 0);
                  return rev > 0 ? (
                    <div key={type} className="flex justify-between"><span className="text-muted-foreground capitalize">{type.replace(/_/g, " ")}</span><span className="font-medium">0</span></div>
                  ) : null;
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-3">Top Products</h3>
              <div className="space-y-2 text-sm">
                {[...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5).map(p => (
                  <div key={p.id} className="flex justify-between"><span className="truncate text-muted-foreground">{p.name}</span><span className="font-medium">0 sales</span></div>
                ))}
                {products.length === 0 && <p className="text-muted-foreground">No data yet.</p>}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <PaymentModal
        open={!!buyingProduct}
        onClose={() => setBuyingProduct(null)}
        item={buyingProduct ? {
          name: buyingProduct.name,
          price: money(buyingProduct.price, buyingProduct.currency),
          amount: buyingProduct.price,
          subtitle: buyingProduct.type?.replace(/_/g, " "),
          category: "beat_sale",
          successMessage: `${buyingProduct.name} is yours! Check your orders for the download link.`,
        } : null}
        onSuccess={confirmPurchase}
      />
    </div>
  );
}

export default function CreatorStore() {
  return (
    <div>
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>To sell products and manage your store, you need to upload at least one release or beat first. <a href="/distribution" className="underline font-medium">Distribute music →</a></span>
      </div>
      <CreatorStoreContent />
    </div>
  );
}