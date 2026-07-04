import React, { useState, useEffect } from 'react';
import { CartItem, PokemonCard } from '../types';
import { TYPE_COLORS } from './SearchPanel';
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, Clipboard, CheckCircle, Navigation, Clock, Truck, Scale } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cardId: string, quantity: number) => void;
  onRemoveItem: (cardId: string) => void;
  onClearCart: () => void;
}

type CheckoutStep = 'cart' | 'details' | 'payment' | 'success';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  
  // Checkout details form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zipCode: '',
    address: '',
    shippingMethod: 'pac' as 'pac' | 'sedex' | 'pickup',
    distance: 350 // Delivery distance in km (initial estimate)
  });

  // Pix payment timer
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [copiedPix, setCopiedPix] = useState(false);

  // Mercado Pago Payment selection & credit card fields
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1'
  });
  const [cardErrors, setCardErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (step !== 'payment') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.card.price * item.quantity, 0);
  };

  const calculateTotalWeight = () => {
    return cartItems.reduce((acc, item) => {
      const isBox = item.card.id.startsWith('BOX') || item.card.name.toLowerCase().includes('booster box');
      const itemWeight = isBox ? 350 : 15; // 350g for Box, 15g for single card
      return acc + (itemWeight * item.quantity);
    }, 0);
  };

  const getPacCost = () => {
    const subtotal = calculateSubtotal();
    if (subtotal >= 600) return 0;
    const weightG = calculateTotalWeight();
    const distance = formData.distance;
    // PAC dynamic rate: base R$ 12.00 + R$ 0.02 per gram + R$ 0.03 per km
    return 12 + (weightG * 0.02) + (distance * 0.03);
  };

  const getSedexCost = () => {
    const subtotal = calculateSubtotal();
    if (subtotal >= 600) return 0;
    const weightG = calculateTotalWeight();
    const distance = formData.distance;
    // SEDEX dynamic rate: base R$ 24.00 + R$ 0.05 per gram + R$ 0.08 per km
    return 24 + (weightG * 0.05) + (distance * 0.08);
  };

  const getShippingCost = () => {
    if (formData.shippingMethod === 'pickup') return 0;
    if (formData.shippingMethod === 'sedex') return getSedexCost();
    return getPacCost();
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingCost();
  };

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 'cart') {
      setStep('details');
    } else if (step === 'details') {
      setStep('payment');
    } else if (step === 'payment') {
      setStep('success');
    }
  };

  const handlePrevStep = () => {
    if (step === 'details') setStep('cart');
    if (step === 'payment') setStep('details');
  };

  const handleCopyPix = () => {
    const pixKey = 'guilhemarinho@gmail.com';
    navigator.clipboard.writeText(pixKey).then(() => {
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    });
  };

  const getInstallmentOptions = () => {
    const total = calculateTotal();
    const options = [];

    // 1x option is always available
    options.push({
      value: "1",
      label: `1x de R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)`
    });

    // Installments only above R$ 250.00
    if (total > 250) {
      // For purchases between R$ 250.00 and R$ 500.00: Can install up to 5 times (with interest)
      // For purchases above R$ 500.00: Can install up to 5 times, where up to 3 times are interest-free
      const interestRatePerMonth = 0.0199; 

      for (let i = 2; i <= 5; i++) {
        let isInterestFree = false;
        let installmentValue = total / i;

        if (total > 500 && i <= 3) {
          isInterestFree = true;
        }

        if (!isInterestFree) {
          // Add monthly simple interest
          installmentValue = (total * (1 + interestRatePerMonth * i)) / i;
        }

        const label = isInterestFree
          ? `${i}x de R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)`
          : `${i}x de R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Com juros de 1.99% a.m.)`;

        options.push({
          value: i.toString(),
          label
        });
      }
    }

    return options;
  };

  const validateCard = () => {
    const errors: { [key: string]: string } = {};
    if (!cardData.number || cardData.number.replace(/\s/g, '').length < 16) {
      errors.number = 'Número de cartão inválido (mínimo 16 dígitos)';
    }
    if (!cardData.name || cardData.name.trim().length < 3) {
      errors.name = 'Nome impresso no cartão é obrigatório';
    }
    if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      errors.expiry = 'Validade inválida (MM/AA)';
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      errors.cvv = 'CVV inválido (3 ou 4 dígitos)';
    }
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const simulateSuccess = () => {
    if (paymentMethod === 'card') {
      const isValid = validateCard();
      if (!isValid) return;
    }
    setStep('success');
    setTimeout(() => {
      onClearCart();
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'zipCode') {
      const cleaned = value.replace(/\D/g, '').slice(0, 8);
      let formatted = cleaned;
      if (cleaned.length > 5) {
        formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
      }
      
      setFormData(prev => {
        const nextData = { ...prev, [name]: formatted };
        if (cleaned.length > 0) {
          let estDistance = 350;
          const firstDigit = cleaned[0];
          
          if (firstDigit === '2') {
            // Rio de Janeiro or Espírito Santo (Origin is Rio das Ostras, RJ)
            if (cleaned.length >= 2) {
              const firstTwo = cleaned.slice(0, 2);
              const numTwo = parseInt(firstTwo);
              if (numTwo === 28) {
                // Região dos Lagos / Norte Fluminense (e.g. Rio das Ostras, Cabo Frio, Macaé)
                estDistance = 35;
              } else if (numTwo >= 20 && numTwo <= 23) {
                // Rio Capital / Baixada Fluminense
                estDistance = 170;
              } else if (numTwo >= 24 && numTwo <= 26) {
                // Niterói / São Gonçalo / Leste Fluminense
                estDistance = 140;
              } else if (numTwo === 27) {
                // Sul Fluminense (Angra, Volta Redonda)
                estDistance = 280;
              } else if (numTwo === 29) {
                // Espírito Santo
                estDistance = 380;
              } else {
                estDistance = 150;
              }
            } else {
              estDistance = 150;
            }
          } else {
            // Other states relative to Rio das Ostras, RJ
            switch (firstDigit) {
              case '0': estDistance = 620; break;   // Grande São Paulo / Capital
              case '1': estDistance = 780; break;   // Interior de SP
              case '3': estDistance = 480; break;   // Minas Gerais
              case '4': estDistance = 1200; break;  // Bahia / Sergipe
              case '5': estDistance = 1950; break;  // Pernambuco / Alagoas / Paraíba / RN
              case '6': estDistance = 2700; break;  // Ceará / Piauí / Maranhão / Norte
              case '7': estDistance = 1250; break;  // Distrito Federal / Goiás / Centro-Oeste
              case '8': estDistance = 1000; break;  // Paraná / Santa Catarina
              case '9': estDistance = 1500; break;  // Rio Grande do Sul
              default: estDistance = 350;
            }
          }
          nextData.distance = estDistance;
        }
        return nextData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
      {/* Overlay backdrop */}
      <div className="absolute inset-0 bg-cyber-darker/80 backdrop-blur-sm cursor-pointer" onClick={onClose} />

      {/* Cart Panel Container */}
      <div
        id="cart-drawer-panel"
        className="relative z-10 w-full max-w-md bg-cyber-dark border-l border-zinc-800 h-full flex flex-col shadow-[-10px_0_30px_rgba(0,255,102,0.05)]"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-neon-green" size={20} />
            <h2 className="font-display font-bold text-zinc-100 text-lg uppercase tracking-wider">
              {step === 'cart' && 'Seu Carrinho'}
              {step === 'details' && 'Dados de Envio'}
              {step === 'payment' && 'Pagamento Pix'}
              {step === 'success' && 'Compra Confirmada'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-neon-purple border border-transparent hover:border-zinc-800 rounded transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Alert inside CartDrawer */}
        {cartItems.length > 0 && step !== 'success' && (
          <div className="bg-cyber-darker px-5 py-3.5 border-b border-zinc-900/60 flex flex-col gap-2 select-none">
            {calculateSubtotal() >= 600 ? (
              <div className="text-neon-green text-[11px] font-semibold flex items-center gap-2 font-display">
                <span className="text-sm">🚚</span>
                <span>Parabéns! Seu pedido qualificou-se para <strong className="text-neon-green font-bold uppercase tracking-wider">Frete Grátis</strong>!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="text-zinc-400 text-[10px] flex justify-between font-display leading-tight">
                  <span>Adicione mais <span className="text-neon-green font-bold font-mono">R$ {(600 - calculateSubtotal()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> para ganhar <strong className="text-neon-green font-bold">FRETE GRÁTIS</strong>!</span>
                </div>
                <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-neon-green h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,255,102,0.5)]" 
                    style={{ width: `${Math.min(100, (calculateSubtotal() / 600) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Steps Render */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'cart' && (
            <>
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                  <div className="w-12 h-12 rounded-full bg-cyber-card border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
                    <ShoppingBag size={22} />
                  </div>
                  <h3 className="text-zinc-300 font-display font-medium text-base mb-1">O carrinho está vazio</h3>
                  <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">
                    Explore nosso cofre de cartas raras e adicione os itens desejados para iniciar seu pedido.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cartItems.map((item) => {
                    const colors = TYPE_COLORS[item.card.type] || TYPE_COLORS.Colorless;
                    return (
                      <div
                        key={item.card.id}
                        className="p-3.5 bg-cyber-card/80 border border-zinc-900 rounded-xl flex gap-3 items-center group relative overflow-hidden"
                      >
                        {/* Shimmer line */}
                        <div className="absolute inset-y-0 left-0 w-1 bg-neon-purple opacity-70" />

                        {/* Thumbnail image */}
                        <img
                          src={item.card.imageUrl}
                          alt={item.card.name}
                          className="w-14 h-18 object-cover rounded-md border border-zinc-900 flex-shrink-0 select-none"
                          referrerPolicy="no-referrer"
                        />

                        {/* Info details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold text-xs text-zinc-100 truncate flex items-center gap-1">
                            {item.card.name}
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500 block leading-none mb-1.5">
                            {item.card.condition} • {item.card.cardNumber} • {(item.card.id.startsWith('BOX') || item.card.name.toLowerCase().includes('booster box')) ? '350g' : '15g'}
                          </span>
                          <span className="font-mono text-xs font-semibold text-neon-green">
                            R$ {item.card.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Controls & Trash */}
                        <div className="flex flex-col items-end gap-2.5">
                          {/* Quantity Counter */}
                          <div className="flex items-center gap-1 border border-zinc-800 bg-cyber-dark rounded-md px-1 py-0.5">
                            <button
                              onClick={() => onUpdateQuantity(item.card.id, item.quantity - 1)}
                              className="text-zinc-500 hover:text-neon-green p-0.5 transition-colors cursor-pointer"
                              title="Diminuir"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="font-mono text-xs text-zinc-300 font-semibold px-1 min-w-[14px] text-center select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.card.id, item.quantity + 1)}
                              className="text-zinc-500 hover:text-neon-green p-0.5 transition-colors cursor-pointer"
                              title="Aumentar"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.card.id)}
                            className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-red-950/20 transition-all cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === 'details' && (
            <form onSubmit={handleNextStep} className="flex flex-col gap-4 font-sans text-xs">
              <div>
                <label className="block text-zinc-400 font-display font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2.5 px-3 text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-display font-semibold mb-1.5 uppercase tracking-wider text-[10px]">E-mail</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="exemplo@gmail.com"
                  className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2.5 px-3 text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-display font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Telefone</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2.5 px-3 text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-display font-semibold mb-1.5 uppercase tracking-wider text-[10px]">CEP de Entrega</label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="01310-100"
                    className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2.5 px-3 text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-display font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Endereço Completo</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Rua, Número, Complemento, Bairro - Cidade/UF"
                  className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2.5 px-3 text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                />
              </div>

              {/* Distance calculation input block */}
              <div className="bg-cyber-card/50 border border-zinc-800/40 rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Navigation size={12} className="text-neon-purple" />
                    <label className="block text-zinc-400 font-display font-semibold uppercase tracking-wider text-[10px]">
                      Distância de Entrega
                    </label>
                  </div>
                  <span className="font-mono text-xs font-bold text-neon-purple bg-neon-purple/10 border border-neon-purple/20 px-2 py-0.5 rounded">
                    {formData.distance} km
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    name="distance"
                    min="10"
                    max="3500"
                    step="10"
                    value={formData.distance}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData(prev => ({ ...prev, distance: val }));
                    }}
                    className="flex-1 accent-neon-purple h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center gap-1 bg-cyber-darker border border-zinc-800 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      name="distance"
                      min="10"
                      max="3500"
                      value={formData.distance}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(3500, parseInt(e.target.value) || 10));
                        setFormData(prev => ({ ...prev, distance: val }));
                      }}
                      className="w-12 text-center bg-transparent text-zinc-200 font-mono text-xs outline-none"
                    />
                    <span className="text-[10px] font-mono text-zinc-500">km</span>
                  </div>
                </div>
                <p className="text-[9px] text-zinc-500 leading-tight font-sans">
                  *Distância estimada com base no CEP informado (saindo do estoque em Rio das Ostras - RJ), ou ajuste manualmente.
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 font-display font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Método de Envio</label>
                <div className="flex flex-col gap-2">
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    formData.shippingMethod === 'pac' ? 'border-neon-purple bg-neon-purple/5 text-zinc-100' : 'border-zinc-800 bg-cyber-dark text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="pac"
                        checked={formData.shippingMethod === 'pac'}
                        onChange={handleInputChange}
                        className="accent-neon-purple"
                      />
                      <div>
                        <span className="font-display font-bold text-xs block">PAC (Correios)</span>
                        <span className="text-[10px] text-zinc-500 block leading-none mt-0.5">Encomenda econômica nacional (5 a 10 dias úteis)</span>
                      </div>
                    </div>
                    <span className="font-mono text-neon-purple font-semibold">
                      {getPacCost() === 0 ? 'Grátis' : `R$ ${getPacCost().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    formData.shippingMethod === 'sedex' ? 'border-neon-purple bg-neon-purple/5 text-zinc-100' : 'border-zinc-800 bg-cyber-dark text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="sedex"
                        checked={formData.shippingMethod === 'sedex'}
                        onChange={handleInputChange}
                        className="accent-neon-purple"
                      />
                      <div>
                        <span className="font-display font-bold text-xs block">SEDEX (Correios)</span>
                        <span className="text-[10px] text-zinc-500 block leading-none mt-0.5">Entrega expressa nacional prioritária (1 a 3 dias úteis)</span>
                      </div>
                    </div>
                    <span className="font-mono text-neon-purple font-semibold">
                      {getSedexCost() === 0 ? 'Grátis' : `R$ ${getSedexCost().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    formData.shippingMethod === 'pickup' ? 'border-neon-purple bg-neon-purple/5 text-zinc-100' : 'border-zinc-800 bg-cyber-dark text-zinc-400 hover:border-zinc-700'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="pickup"
                        checked={formData.shippingMethod === 'pickup'}
                        onChange={handleInputChange}
                        className="accent-neon-purple"
                      />
                      <div>
                        <span className="font-display font-bold text-xs block">Retirar na Loja (Setor 09)</span>
                        <span className="text-[10px] text-zinc-500 block leading-none mt-0.5">Retirada gratuita em nossa filial em Neo-Akihabara</span>
                      </div>
                    </div>
                    <span className="font-mono text-neon-green font-semibold">Grátis</span>
                  </label>
                </div>
              </div>

              {/* Form submit anchor */}
              <input type="submit" id="submit-shipping-form" className="hidden" />
            </form>
          )}

          {step === 'payment' && (
            <div className="flex flex-col gap-4 text-center select-none font-sans">
              {/* Payment Method Selector (Mercado Pago Style but Cyberpunk theme) */}
              <div className="text-left">
                <span className="block text-zinc-400 font-display font-semibold mb-2 uppercase tracking-wider text-[10px]">
                  Forma de Pagamento (Seguro pelo Mercado Pago)
                </span>
                <div className="grid grid-cols-2 gap-2 p-1 bg-cyber-darker border border-zinc-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`py-2 px-1 rounded-lg text-[11px] font-display font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'bg-neon-purple/20 border border-neon-purple/40 text-neon-purple shadow-[0_0_8px_rgba(188,19,254,0.2)]'
                        : 'border border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-sm font-black">⚡ Pix</span>
                    <span className="text-[8px] opacity-70">Aprovação instantânea</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-1 rounded-lg text-[11px] font-display font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-neon-purple/20 border border-neon-purple/40 text-neon-purple shadow-[0_0_8px_rgba(188,19,254,0.2)]'
                        : 'border border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <CreditCard size={14} className="mt-0.5" />
                    <span className="text-[11px] font-bold">Cartão</span>
                    <span className="text-[8px] opacity-70">Em até 5x</span>
                  </button>
                </div>
              </div>

              {/* PIX view */}
              {paymentMethod === 'pix' && (
                <div className="flex flex-col items-center justify-center p-2">
                  <div className="mb-4 bg-gradient-to-r from-neon-purple/10 to-neon-green/10 p-3.5 rounded-2xl border border-zinc-800/80 w-full max-w-sm">
                    <div className="flex items-center justify-center gap-1.5 font-mono text-neon-purple font-bold text-sm mb-2.5">
                      <Clock size={16} className="text-neon-purple animate-pulse" />
                      <span>Aguardando Pix: {formatTime(timeLeft)}</span>
                    </div>

                    {/* Simulated QR Code Canvas design with the custom key */}
                    <div className="w-44 h-44 bg-white p-2.5 rounded-xl border-2 border-neon-green flex items-center justify-center mx-auto shadow-neon-green">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020126580014BR.GOV.BCB.PIX0122guilhemarinho@gmail.com5204000053039865802BR5911Sunrise TCG6009SAO PAULO62070503***6304EE85`}
                        alt="Pix QR Code"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 max-w-xs mb-4 leading-relaxed">
                    Escaneie o código QR acima ou copie a chave Pix abaixo. O sistema Mercado Pago identificará o pagamento e aprovará seu pedido na hora.
                  </p>

                  {/* Copy Pix Key Input and Button */}
                  <div className="w-full flex items-center bg-cyber-dark border border-zinc-800/80 rounded-xl py-2 px-3.5 mb-4 font-mono text-[11px] text-zinc-400">
                    <span className="flex-1 truncate text-left pr-2 text-zinc-300 select-all font-semibold">
                      guilhemarinho@gmail.com
                    </span>
                    <button
                      onClick={handleCopyPix}
                      className={`p-1.5 border rounded flex items-center gap-1.5 transition-all text-xs font-display cursor-pointer font-bold ${
                        copiedPix
                          ? 'border-neon-green bg-neon-green/10 text-neon-green'
                          : 'border-zinc-800 hover:border-neon-purple hover:text-neon-purple text-zinc-400'
                      }`}
                    >
                      {copiedPix ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                      <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Credit Card view */}
              {paymentMethod === 'card' && (
                <div className="flex flex-col gap-3.5 text-left w-full mt-2">
                  {/* Cyber Card Visual Preview */}
                  <div className="relative h-28 w-full bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-lg select-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-2xl" />
                    <div className="flex justify-between items-center z-10">
                      <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase">MERCADO PAGO SECURE NET</span>
                      <span className="font-display font-black text-[10px] text-neon-purple tracking-widest">SUNRISE CARDS</span>
                    </div>
                    
                    <div className="z-10 mt-1">
                      <div className="font-mono text-zinc-300 text-sm tracking-widest">
                        {cardData.number ? cardData.number : '•••• •••• •••• ••••'}
                      </div>
                    </div>

                    <div className="flex justify-between items-end z-10">
                      <div>
                        <span className="text-[7px] text-zinc-500 block uppercase">Portador</span>
                        <span className="font-mono text-[10px] text-zinc-400 uppercase truncate block max-w-[150px]">
                          {cardData.name ? cardData.name : 'NOME COMPLETO'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[7px] text-zinc-500 block uppercase">Validade</span>
                        <span className="font-mono text-[10px] text-zinc-400">
                          {cardData.expiry ? cardData.expiry : 'MM/AA'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Fields Form */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-zinc-500 font-display font-semibold mb-1 uppercase tracking-wider text-[9px]">Número do Cartão</label>
                      <input
                        type="text"
                        name="number"
                        placeholder="4578 3214 8596 4125"
                        maxLength={19}
                        value={cardData.number}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
                          setCardData(prev => ({ ...prev, number: val }));
                        }}
                        className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2 px-3 text-zinc-200 placeholder-zinc-700 outline-none transition-colors text-xs font-mono"
                      />
                      {cardErrors.number && <span className="text-red-400 text-[9px] mt-0.5 block">{cardErrors.number}</span>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-zinc-500 font-display font-semibold mb-1 uppercase tracking-wider text-[9px]">Nome Impresso no Cartão</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="JOÃO S SILVA"
                        value={cardData.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCardData(prev => ({ ...prev, name: val }));
                        }}
                        className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2 px-3 text-zinc-200 placeholder-zinc-700 outline-none transition-colors text-xs uppercase"
                      />
                      {cardErrors.name && <span className="text-red-400 text-[9px] mt-0.5 block">{cardErrors.name}</span>}
                    </div>

                    <div>
                      <label className="block text-zinc-500 font-display font-semibold mb-1 uppercase tracking-wider text-[9px]">Validade (MM/AA)</label>
                      <input
                        type="text"
                        name="expiry"
                        placeholder="12/29"
                        maxLength={5}
                        value={cardData.expiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 2) {
                            val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                          }
                          setCardData(prev => ({ ...prev, expiry: val }));
                        }}
                        className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2 px-3 text-zinc-200 placeholder-zinc-700 outline-none transition-colors text-xs font-mono"
                      />
                      {cardErrors.expiry && <span className="text-red-400 text-[9px] mt-0.5 block">{cardErrors.expiry}</span>}
                    </div>

                    <div>
                      <label className="block text-zinc-500 font-display font-semibold mb-1 uppercase tracking-wider text-[9px]">Código CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        placeholder="123"
                        maxLength={4}
                        value={cardData.cvv}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setCardData(prev => ({ ...prev, cvv: val }));
                        }}
                        className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2 px-3 text-zinc-200 placeholder-zinc-700 outline-none transition-colors text-xs font-mono"
                      />
                      {cardErrors.cvv && <span className="text-red-400 text-[9px] mt-0.5 block">{cardErrors.cvv}</span>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-zinc-500 font-display font-semibold mb-1 uppercase tracking-wider text-[9px]">Opções de Parcelamento</label>
                      <select
                        name="installments"
                        value={getInstallmentOptions().some(o => o.value === cardData.installments) ? cardData.installments : '1'}
                        onChange={(e) => {
                          setCardData(prev => ({ ...prev, installments: e.target.value }));
                        }}
                        className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-purple rounded-lg py-2.5 px-3 text-zinc-200 outline-none transition-colors text-xs font-sans"
                      >
                        {getInstallmentOptions().map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {calculateTotal() <= 250 && (
                        <p className="text-[9px] text-zinc-500 font-sans mt-1">
                          *Parcelamento disponível apenas para compras acima de R$ 250,00.
                        </p>
                      )}
                      {calculateTotal() > 250 && calculateTotal() <= 500 && (
                        <p className="text-[9px] text-zinc-400 font-sans mt-1">
                          *Compre acima de R$ 500,00 para parcelar em até 3x sem juros!
                        </p>
                      )}
                      {calculateTotal() > 500 && (
                        <p className="text-[9px] text-neon-green font-sans mt-1">
                          ✓ Parcelamento sem juros ativado em até 3x!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Address Preview */}
              <div className="w-full p-3.5 bg-cyber-card/60 border border-zinc-900 rounded-xl flex items-start gap-3 text-left">
                <Navigation size={18} className="text-neon-green mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-semibold text-xs text-zinc-200">Endereço de Envio</h4>
                  <p className="text-[10px] text-zinc-500 font-sans leading-tight mt-0.5">{formData.address}</p>
                </div>
              </div>

              {/* Secure Mercado Pago badge */}
              <div className="w-full bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-2.5 mt-1 flex items-center justify-center gap-2">
                <span className="text-xs text-neon-purple">🛡️</span>
                <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-semibold font-display">
                  Pagamento Seguro garantido pelo <span className="text-sky-400">Mercado Pago</span>
                </span>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-neon-green/10 border-2 border-neon-green flex items-center justify-center text-neon-green shadow-neon-green mb-5 animate-bounce">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-display font-black text-zinc-100 uppercase tracking-wider mb-2">Pedido Recebido!</h3>
              <p className="text-zinc-400 text-xs max-w-xs leading-relaxed mb-6">
                Parabéns! O pagamento foi identificado em nossa rede neural. Suas cartas raras estão sendo blindadas e separadas para o envio pelos Correios.
              </p>

              <div className="w-full bg-cyber-card border border-zinc-800/60 p-4 rounded-2xl flex flex-col gap-2.5 text-left mb-6 font-mono text-[11px] text-zinc-400">
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">ID DO PEDIDO:</span>
                  <span className="text-zinc-300 font-bold">#TCG-8954-{Math.floor(Math.random() * 9000 + 1000)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">CLIENTE:</span>
                  <span className="text-zinc-300 font-bold truncate max-w-[150px]">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">MÉTODO:</span>
                  <span className="text-zinc-300 font-bold">
                    {formData.shippingMethod === 'pac' ? 'PAC (Correios)' : formData.shippingMethod === 'sedex' ? 'SEDEX (Correios)' : 'Retirada'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-neon-green to-emerald-600 text-cyber-dark font-display font-bold rounded-xl text-xs transition-all duration-300 shadow-neon-green cursor-pointer"
              >
                Voltar à Loja
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer (Subtotal and Actions) */}
        {step !== 'success' && cartItems.length > 0 && (
          <div className="p-5 border-t border-zinc-900 bg-cyber-darker relative z-10 select-none">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>Subtotal:</span>
                <span>R$ {calculateSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="flex items-center gap-1">
                  <Scale size={11} className="text-zinc-600 animate-pulse" /> Peso Total:
                </span>
                <span>{(calculateTotalWeight() / 1000).toFixed(3)} kg ({calculateTotalWeight()}g)</span>
              </div>

              {formData.shippingMethod !== 'pickup' && (
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Navigation size={11} className="text-zinc-600" /> Distância:
                  </span>
                  <span>{formData.distance} km</span>
                </div>
              )}
              
              {step !== 'cart' && (
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Truck size={11} className="text-zinc-600" /> Frete ({formData.shippingMethod === 'pac' ? 'PAC' : formData.shippingMethod === 'sedex' ? 'SEDEX' : 'Retirada'}):
                  </span>
                  <span className="font-semibold text-zinc-300">
                    {getShippingCost() === 0 ? 'Grátis' : `R$ ${getShippingCost().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5">
                <span className="font-display font-bold text-sm text-zinc-300">Valor Total:</span>
                <span className="font-mono text-xl font-black text-neon-green">
                  R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex gap-3">
              {/* Back Button for multi-step */}
              {step !== 'cart' && (
                <button
                  onClick={handlePrevStep}
                  className="px-4 py-3.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-display font-bold transition-all cursor-pointer"
                >
                  Voltar
                </button>
              )}

              {/* Primary action Button */}
              {step === 'cart' && (
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 py-3.5 bg-gradient-to-r from-neon-purple to-purple-700 hover:from-purple-600 hover:to-neon-purple text-zinc-100 font-display font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_0_15px_rgba(188,19,254,0.15)] hover:shadow-[0_0_20px_rgba(188,19,254,0.35)] cursor-pointer"
                >
                  <CreditCard size={14} />
                  <span>Finalizar Compra</span>
                </button>
              )}

              {step === 'details' && (
                <button
                  onClick={() => {
                    const formSubmit = document.getElementById('submit-shipping-form');
                    if (formSubmit) formSubmit.click();
                  }}
                  className="flex-1 py-3.5 bg-gradient-to-r from-neon-green to-emerald-600 hover:from-emerald-500 hover:to-neon-green text-cyber-dark font-display font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,102,0.15)] hover:shadow-[0_0_20px_rgba(0,255,102,0.35)] cursor-pointer"
                >
                  <span>Ir para o Pagamento</span>
                </button>
              )}

              {step === 'payment' && (
                <button
                  onClick={simulateSuccess}
                  className="flex-1 py-3.5 bg-gradient-to-r from-neon-green to-emerald-600 hover:from-emerald-500 hover:to-neon-green text-cyber-dark font-display font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,102,0.15)] hover:shadow-[0_0_20px_rgba(0,255,102,0.35)] cursor-pointer"
                >
                  <span>
                    {paymentMethod === 'pix' ? 'Simular Confirmação Pix' : 'Simular Pagamento Cartão'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
