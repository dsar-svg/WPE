import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Product, ProductChoice } from '../../types';

interface ChoiceSelectorModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: (selectedChoices: string[]) => void;
}

export function ChoiceSelectorModal({ product, onClose, onConfirm }: ChoiceSelectorModalProps) {
  const choices = product.choices || [];
  const maxSelections = product.maxSelections ?? 0;
  const isSingleSelect = maxSelections === 1;
  const [selected, setSelected] = useState<string[]>([]);

  const getChoicePrice = (choice: ProductChoice): number => {
    return choice.priceAdjust ?? 0;
  };

  const toggleChoice = (name: string) => {
    if (isSingleSelect) {
      setSelected([name]);
      return;
    }

    setSelected(prev => {
      if (prev.includes(name)) {
        return prev.filter(n => n !== name);
      }
      if (maxSelections > 0 && prev.length >= maxSelections) {
        return prev;
      }
      return [...prev, name];
    });
  };

  const totalPrice = () => {
    let adjust = 0;
    choices.forEach(c => {
      if (selected.includes(c.name)) {
        adjust += getChoicePrice(c);
      }
    });
    return product.price + adjust;
  };

  const handleConfirm = () => {
    onConfirm(selected.length > 0 ? selected : []);
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-sm bg-dark-card rounded-3xl overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 text-center">
          <h3 className="font-display text-2xl uppercase tracking-wider text-white mb-2">
            {product.name}
          </h3>
          <p className="text-zinc-400 text-sm">
            Este {product.name} incluye una ración de:
          </p>
        </div>

        {/* Options */}
        <div className="px-6 space-y-3">
          {choices.map((choice) => {
            const isSelected = selected.includes(choice.name);
            const price = getChoicePrice(choice);

            return (
              <button
                key={choice.name}
                onClick={() => toggleChoice(choice.name)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-primary-vibrant/20 to-secondary-vibrant/20 border-primary-vibrant/50 shadow-lg shadow-primary-vibrant/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-primary-vibrant border-primary-vibrant'
                      : 'border-zinc-600'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                    {choice.name}
                  </span>
                </div>
                {price !== 0 && (
                  <span className="text-xs font-bold text-secondary-vibrant">
                    {price > 0 ? `+$${price.toFixed(2)}` : `-$${Math.abs(price).toFixed(2)}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="p-6 pt-6">
          <button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white py-4 rounded-2xl font-display uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary-vibrant/30 flex items-center justify-center gap-3 hover:shadow-primary-vibrant/50 transition-shadow duration-300"
          >
            Agregar al carrito ${totalPrice().toFixed(2)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
