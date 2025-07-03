import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Search, Plus, Minus, ShoppingCart, X, Package, AlertTriangle } from 'lucide-react';
import { PartCartItem } from '../../hooks/useServiceOrderParts';

interface PartsCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: any[];
  onSaveCart: (cartItems: PartCartItem[]) => Promise<void>;
}

export const PartsCartModal: React.FC<PartsCartModalProps> = ({
  isOpen,
  onClose,
  parts,
  onSaveCart
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<PartCartItem[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (part: any) => {
    if (part.quantity <= 0) {
      return <Badge variant="error">Sem Estoque</Badge>;
    } else if (part.quantity <= part.min_stock) {
      return <Badge variant="warning">Estoque Baixo</Badge>;
    }
    return <Badge variant="success">Disponível</Badge>;
  };

  const addToCart = (part: any) => {
    const existingItem = cart.find(item => item.part_id === part.id);
    
    if (existingItem) {
      if (existingItem.quantity_to_use < part.quantity) {
        setCart(prev => prev.map(item =>
          item.part_id === part.id
            ? {
                ...item,
                quantity_to_use: item.quantity_to_use + 1,
                total_cost: (item.quantity_to_use + 1) * item.unit_cost
              }
            : item
        ));
      }
    } else {
      if (part.quantity > 0) {
        const newItem: PartCartItem = {
          part_id: part.id,
          sku: part.sku,
          name: part.name,
          available_quantity: part.quantity,
          quantity_to_use: 1,
          unit_cost: part.unit_cost,
          total_cost: part.unit_cost
        };
        setCart(prev => [...prev, newItem]);
      }
    }
  };

  const removeFromCart = (partId: string) => {
    const existingItem = cart.find(item => item.part_id === partId);
    
    if (existingItem && existingItem.quantity_to_use > 1) {
      setCart(prev => prev.map(item =>
        item.part_id === partId
          ? {
              ...item,
              quantity_to_use: item.quantity_to_use - 1,
              total_cost: (item.quantity_to_use - 1) * item.unit_cost
            }
          : item
      ));
    } else {
      setCart(prev => prev.filter(item => item.part_id !== partId));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleSaveCart = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      await onSaveCart(cart);
      setCart([]);
      onClose();
    } catch (error) {
      console.error('Error saving cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity_to_use, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col lg:flex-row">
        {/* Left Panel - Parts List */}
        <div className="flex-1 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-secondary-200">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">
              Selecionar Peças para Manutenção
            </h2>
            <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 lg:hidden">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="mb-4 lg:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar peça por nome ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Parts List */}
          <div className="space-y-3 max-h-64 lg:max-h-96 overflow-y-auto">
            {filteredParts.map((part) => (
              <div key={part.id} className="flex items-center justify-between p-3 lg:p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 truncate">{part.name}</p>
                      <p className="text-sm text-secondary-600">SKU: {part.sku}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-secondary-500">
                          Disponível: {part.quantity}
                        </span>
                        {getStockStatus(part)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {cart.find(item => item.part_id === part.id) ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(part.id)}
                        className="p-1 text-error-600 hover:bg-error-100 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {cart.find(item => item.part_id === part.id)?.quantity_to_use || 0}
                      </span>
                      <button
                        onClick={() => addToCart(part)}
                        disabled={part.quantity <= (cart.find(item => item.part_id === part.id)?.quantity_to_use || 0)}
                        className="p-1 text-primary-600 hover:bg-primary-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => addToCart(part)}
                      disabled={part.quantity <= 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Adicionar</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredParts.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhuma peça encontrada</p>
            </div>
          )}
        </div>

        {/* Right Panel - Cart */}
        <div className="w-full lg:w-96 p-4 lg:p-6 bg-secondary-50">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Carrinho ({totalCartItems})
            </h3>
            <div className="flex items-center space-x-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-error-600 hover:text-error-800"
                >
                  Limpar
                </button>
              )}
              <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 hidden lg:block">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Carrinho vazio</p>
              <p className="text-sm text-secondary-500 mt-1">
                Adicione peças para usar na manutenção
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 mb-6 max-h-48 lg:max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.part_id} className="bg-white p-3 rounded-lg border border-secondary-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-900 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-secondary-600">SKU: {item.sku}</p>
                      </div>
                      <button
                        onClick={() => setCart(prev => prev.filter(i => i.part_id !== item.part_id))}
                        className="text-error-600 hover:text-error-800 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromCart(item.part_id)}
                          className="p-1 text-error-600 hover:bg-error-100 rounded"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity_to_use}
                        </span>
                        <button
                          onClick={() => addToCart({ 
                            id: item.part_id, 
                            sku: item.sku, 
                            name: item.name, 
                            quantity: item.available_quantity,
                            unit_cost: item.unit_cost
                          })}
                          disabled={item.quantity_to_use >= item.available_quantity}
                          className="p-1 text-primary-600 hover:bg-primary-100 rounded disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-secondary-600">
                          Disponível: {item.available_quantity}
                        </p>
                      </div>
                    </div>
                    {item.quantity_to_use > item.available_quantity && (
                      <div className="flex items-center mt-2 text-error-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span className="text-xs">Quantidade insuficiente em estoque</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Cart Summary - Only show total items, no values */}
              <div className="border-t border-secondary-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Total de Itens:</span>
                  <span className="font-medium">{totalCartItems}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleSaveCart}
                  disabled={loading || cart.some(item => item.quantity_to_use > item.available_quantity)}
                  className="w-full"
                >
                  {loading ? 'Processando...' : 'Usar Peças na Manutenção'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};