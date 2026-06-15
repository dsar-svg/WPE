
import { CartItem, CheckoutData, Location, RestaurantConfig } from './types';

export function generateWhatsAppLink(
  location: Location,
  items: CartItem[],
  checkout: CheckoutData,
  config: RestaurantConfig
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRateActive = config.taxRate ?? 0;
  const tax = subtotal * taxRateActive;
  const subtotalWithTax = subtotal + tax;

  const deliveryFee = checkout.calculatedDeliveryFee ?? config.deliveryFee ?? 0;

  const totalUSD = subtotalWithTax + deliveryFee;
  const totalVES = totalUSD * (config.exchangeRate || 1);

  let message = `*NUEVO PEDIDO - W PANDA EXPRESS*\n`;
  message += `----------------------------------\n`;
  message += `*Cliente:* ${checkout.name}\n`;
  message += `*Teléfono:* ${checkout.phone}\n`;
  message += `*Tipo:* Delivery\n`;

  if (checkout.address) message += `*Dirección:* ${checkout.address}\n`;
  if (checkout.reference) message += `*Referencia:* ${checkout.reference}\n`;
  if (checkout.calculatedDistance != null) {
    message += `*Distancia:* ${checkout.calculatedDistance} km\n`;
  }
  if (checkout.deliveryCoordinates) {
    const { lat, lng } = checkout.deliveryCoordinates;
    message += `*Ubicación:* https://www.google.com/maps?q=${lat},${lng}\n`;
  }

  message += `----------------------------------\n`;
  message += `*PRODUCTOS:*\n`;

  items.forEach((item) => {
    const choicesText = item.selectedChoices && Object.keys(item.selectedChoices).length > 0
      ? ` - ${Object.values(item.selectedChoices).join(', ')}`
      : '';
    message += `• ${item.quantity}x ${item.name}${choicesText} ($${(item.price * item.quantity).toFixed(2)})\n`;
    if (item.notes) {
      message += `  _Nota: ${item.notes}_\n`;
    }
  });

  message += `----------------------------------\n`;
  message += `*Subtotal:* $${subtotal.toFixed(2)}\n`;
  if (tax > 0) message += `*Impuesto (${(taxRateActive * 100).toFixed(1)}%):* $${tax.toFixed(2)}\n`;
  message += `*Delivery:* $${deliveryFee.toFixed(2)}\n`;
  message += `*TOTAL:* $${totalUSD.toFixed(2)}\n`;
  message += `*TOTAL (Bs):* ${totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.\n`;
  message += `*(Tasa: ${config.exchangeRate})*\n`;
  message += `----------------------------------\n`;
  message += `_Pedido realizado desde la App Web_`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${location.whatsapp}?text=${encodedMessage}`;
}
