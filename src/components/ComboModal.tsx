import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { Combo, ComboProduct } from "@/types/combo";
import { Product } from "@/types/product";
import { ComboCategory } from "@/types/ComboCategory";
import { api } from "@/services/api";
import { toast } from 'sonner'; // Replace useToast with sonner
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import Image from 'next/image';
import { X, Upload, Loader2 } from 'lucide-react';

interface ComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Combo>, selectedProducts: ComboProduct[]) => void;
  combo?: Combo;
  mode: 'add' | 'edit';
}

export function ComboModal({ isOpen, onClose, onSubmit, combo, mode }: ComboModalProps) {
  const [formData, setFormData] = useState<Partial<Combo>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    isAvailable: true,
    categoryId: undefined
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ComboCategory[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<number, ComboProduct>>(new Map());
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempQuantities, setTempQuantities] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, combo]);

  const getImageUrl = (filePath: string) => {
    if (!filePath) return '';
    return `${process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000"}/${filePath}`;
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const productsData = await api.getProducts();
      const categoriesData = await api.getComboCategories();
      
      setProducts(productsData);
      setCategories(categoriesData);
  
      if (mode === 'edit' && combo?.id) {
        let comboDetail = combo;
        if (combo.id) {
          try {
            comboDetail = await api.getComboById(combo.id);
          } catch (error) {
            console.error("Không thể lấy thông tin chi tiết combo:", error);
          }
        }

        setFormData({
          id: comboDetail.id,
          name: comboDetail.name || '',
          description: comboDetail.description || '',
          price: comboDetail.price || 0,
          imageUrl: comboDetail.imageUrl || '',
          isAvailable: comboDetail.isAvailable ?? true,
          categoryId: comboDetail.categoryId || (comboDetail.category?.id) || undefined
        });
  
        const comboProducts = await api.getComboProductsByComboId(comboDetail.id);
        
        const productMap = new Map<number, ComboProduct>();
        
        comboProducts.forEach(cp => {
          productMap.set(cp.productId, {
            productId: cp.productId,
            comboId: comboDetail.id,
            quantity: cp.quantity || 1,
            productName: cp.productName || productsData.find(p => p.id === cp.productId)?.name || ''
          });
        });
        
        setSelectedProducts(productMap);
      } else {
        setFormData({
          name: '',
          description: '',
          price: 0,
          imageUrl: '',
          isAvailable: true,
          categoryId: undefined
        });
        setSelectedProducts(new Map());
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Không thể tải dữ liệu'); // Updated to sonner
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageLoading(true);
      const response = await api.uploadImage(file);
      const imageUrl = getImageUrl(response.filePath);

      setFormData(prev => ({
        ...prev,
        imageUrl: imageUrl
      }));

      toast.success('Tải ảnh thành công'); // Updated to sonner
    } catch (error) {
      toast.error('Không thể tải ảnh'); // Updated to sonner
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      setImageLoading(true);
      setFormData(prev => ({
        ...prev,
        imageUrl: ''
      }));

      toast.success('Xóa ảnh thành công'); // Updated to sonner
    } catch (error) {
      toast.error('Không thể xóa ảnh'); // Updated to sonner
    } finally {
      setImageLoading(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const newPrice = parseFloat(rawValue);
    setFormData(prev => ({
      ...prev,
      price: isNaN(newPrice) ? 0 : newPrice
    }));
  };
  
  const handleProductSelection = (product: Product, checked: boolean ) => {
    const newSelection = new Map(selectedProducts);
    
    if (checked) {
      newSelection.set(product.id, {
        productId: product.id,
        comboId: combo?.id || 0,
        quantity: 1,
        productName: product.name
      });
    } else {
      newSelection.delete(product.id);
    }
    
    setSelectedProducts(newSelection);
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    
    const newSelection = new Map(selectedProducts);
    const product = newSelection.get(productId);
    
    if (product) {
      newSelection.set(productId, { 
        ...product, 
        quantity: quantity
      });
      setSelectedProducts(newSelection);
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;
    selectedProducts.forEach((comboProduct) => {
      const product = products.find(p => p.id === comboProduct.productId);
      if (product) {
        total += product.price * comboProduct.quantity;
      }
    });
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.size === 0) {
      toast.error('Phải chọn ít nhất 1 sản phẩm'); // Updated to sonner
      return;
    }

    const submissionData = {
      ...formData,
      price: formData.price || calculateTotalPrice()
    };

    onSubmit(submissionData, Array.from(selectedProducts.values()));
    onClose();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Thêm Combo Mới' : 'Chỉnh Sửa Combo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên Combo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  value={formData.categoryId?.toString() || ""}
                  onValueChange={(value) => 
                    setFormData({ ...formData, categoryId: value ? parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Giá (Tự động tính: {calculateTotalPrice().toLocaleString()}đ)</Label>
                <Input
                  id="price"
                  type="text"
                  value={formData.price?.toLocaleString('vi-VN')}
                  onChange={handlePriceChange}
                  placeholder="Để trống để tự động tính"
                />
              </div>

              <div className="space-y-2">
                <Label>Hình ảnh</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 border rounded-lg overflow-hidden">
                    {formData.imageUrl ? (
                      <>
                        <Image
                          src={formData.imageUrl}
                          alt="Combo"
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={handleDeleteImage}
                          disabled={imageLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-100">
                        {imageLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageLoading}
                  >
                    {imageLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang tải...
                      </>
                    ) : (
                      'Chọn ảnh'
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                />
                <Label htmlFor="isAvailable">Đang bán</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Chọn sản phẩm cho combo ({selectedProducts.size} sản phẩm đã chọn)</Label>
              <div className="border rounded-md h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Chọn</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead className="w-24">Số lượng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={(checked: boolean) => 
                              handleProductSelection(product, checked)
                            }
                          />
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.price.toLocaleString()}đ</TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={tempQuantities[product.id] ?? selectedProducts.get(product.id)?.quantity?.toString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*$/.test(value)) {
                                setTempQuantities((prev) => ({
                                  ...prev,
                                  [product.id]: value
                                }));
                              }
                            }}
                            onBlur={() => {
                              const raw = tempQuantities[product.id];
                              const parsed = parseInt(raw);
                              if (!isNaN(parsed)) {
                                handleQuantityChange(product.id, parsed);
                              }
                              setTempQuantities((prev) => {
                                const newState = { ...prev };
                                delete newState[product.id];
                                return newState;
                              });
                            }}
                            disabled={!selectedProducts.has(product.id)}
                            className="w-20"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              {mode === 'add' ? 'Thêm' : 'Cập nhật'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}