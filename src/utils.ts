
import { CartItem, CheckoutData, Location } from './types';
import { EXCHANGE_RATE, DELIVERY_FEE } from './constants';

export function generateWhatsAppLink(
  location: Location,
  items: CartItem[],
  checkout: CheckoutData
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRateActive = location.taxRate ?? 0;
  const tax = subtotal * taxRateActive;
  const subtotalWithTax = subtotal + tax;

  // Usar tarifa calculada por distancia si está disponible, sino la tarifa base
  const deliveryFee = checkout.deliveryType === 'Delivery'
    ? (checkout.calculatedDeliveryFee ?? checkout.selectedZone?.fee ?? location.deliveryFee ?? 0)
    : 0;

  const totalUSD = subtotalWithTax + deliveryFee;
  const totalVES = totalUSD * (location.exchangeRate || 1);

  let message = `*NUEVO PEDIDO - W PANDA EXPRESS*\n`;
  message += `----------------------------------\n`;
  message += `*Cliente:* ${checkout.name}\n`;
  message += `*Teléfono:* ${checkout.phone}\n`;
  message += `*Tipo:* ${checkout.deliveryType}\n`;

  if (checkout.deliveryType === 'Delivery') {
    if (checkout.selectedZone) message += `*Zona:* ${checkout.selectedZone.name}\n`;
    if (checkout.address) message += `*Dirección:* ${checkout.address}\n`;
    if (checkout.reference) message += `*Referencia:* ${checkout.reference}\n`;
    // Agregar información de distancia si está disponible
    if (checkout.calculatedDistance !== undefined && checkout.calculatedDistance !== null) {
      message += `*Distancia:* ${checkout.calculatedDistance} km\n`;
    }
  }

  message += `----------------------------------\n`;
  message += `*PRODUCTOS:*\n`;

  items.forEach((item) => {
    message += `• ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
    if (item.notes) {
      message += `  _Nota: ${item.notes}_\n`;
    }
  });

  message += `----------------------------------\n`;
  message += `*Subtotal:* $${subtotal.toFixed(2)}\n`;
  if (tax > 0) message += `*Impuesto (${(taxRateActive * 100).toFixed(1)}%):* $${tax.toFixed(2)}\n`;
  if (checkout.deliveryType === 'Delivery') {
    message += `*Delivery:* $${deliveryFee.toFixed(2)}\n`;
  }
  message += `*TOTAL:* $${totalUSD.toFixed(2)}\n`;
  message += `*TOTAL (Bs):* ${totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.\n`;
  message += `*(Tasa: ${location.exchangeRate})*\n`;
  message += `----------------------------------\n`;
  message += `_Pedido realizado desde la App Web_`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${location.whatsapp}?text=${encodedMessage}`;
}
