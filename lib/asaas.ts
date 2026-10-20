// All provider requests and prices are server-side. Never import this in a client component.
async function database() { return (await import('cloudflare:workers')).env.DB; }
export function asaasAmountCents() {
  const value = Number(process.env.ASAAS_AMOUNT_CENTS || 3790);
  if (!Number.isSafeInteger(value) || value < 100 || value > 9990) throw new Error('Valor do pagamento não configurado.');
  return value;
}
export function paymentsEnabled() {
  return String(process.env.PAYMENTS_ENABLED ?? "true").toLowerCase() !== "false";
}
async function api(path: string, body?: unknown) {
  const key = process.env.ASAAS_API_KEY?.trim();
  if (!key) throw new Error('O Asaas ainda não está configurado.');
  const response = await fetch(`https://api.asaas.com/v3${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {access_token:key, 'Content-Type':'application/json', 'User-Agent':'AstroIA/1.0'},
    ...(body === undefined ? {} : {body:JSON.stringify(body)}),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    console.error('asaas_api_failed', {status:response.status, operation:path.split('?')[0].split('/').slice(0,2).join('/')});
    throw new Error(response.status === 401 || response.status === 403 ? 'O Asaas não autorizou a integração. Verifique a configuração da conta.' : 'O Asaas não conseguiu concluir a solicitação. Tente novamente em instantes.');
  }
  return response.json();
}
function validUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {const u=new URL(value); return u.protocol === 'https:' && ['www.asaas.com','asaas.com'].includes(u.hostname) && !u.username && !u.password;} catch {return false;}
}
type Order = {id:string; amount_cents:number; status:string; provider_preference_id:string|null; provider_payment_id:string|null; provider_status:string|null; updated_at:number};
async function order(id:string) {return (await database()).prepare('SELECT * FROM payment_orders WHERE id = ?').bind(id).first<Order>();}
// Use the payment-link experience that was already validated on the live site:
// it opens the familiar Asaas payment page and returns to the private map.
const CHECKOUT_VERSION = 'pix-link-return-v6';
const SITE_ORIGIN = (process.env.ASTROIA_SITE_URL || "https://meuastroia.com.br").replace(/\/+$/, "");
export async function createAsaasCheckout(token:string, email:string, personName:string) {
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
  const id=`asaas_${hash}`;
  const db=await database();
  const now=Date.now();
  await db.prepare(`INSERT INTO payment_orders (id,offer_mode,amount_cents,currency,customer_email,person_name,theme_label,status,created_at,updated_at)
    VALUES (?, 'individual', ?, 'BRL', ?, ?, 'Mapa completo · cinco áreas', 'creating', ?, ?) ON CONFLICT(id) DO NOTHING`)
    .bind(id,asaasAmountCents(),email,personName.slice(0,100),now,now).run();
  let current=(await order(id))!;
  if (current.status==='approved') throw new Error('Este mapa já está pago. Clique em Consultar pagamento / reabrir.');
  if (['refunded','chargeback'].includes(current.status)) throw new Error('Este pedido foi estornado ou contestado. Crie uma nova prévia para uma nova compra.');
  if (current.provider_preference_id && current.provider_status === `link_ready_${CHECKOUT_VERSION}`) {
    const saved=await db.prepare('SELECT checkout_url FROM guest_reports WHERE order_id = ?').bind(id).first<{checkout_url:string}>();
    if (saved && validUrl(saved.checkout_url)) return {orderId:id,checkoutUrl:saved.checkout_url,amountCents:current.amount_cents};
  }
  const lock=await db.prepare(`UPDATE payment_orders SET provider_status='creating_link',updated_at=? WHERE id=? AND (provider_status IS NULL OR provider_status!='creating_link' OR updated_at < ?) RETURNING id`)
    .bind(now,id,now-90000).first();
  if (!lock) throw new Error('Seu pagamento está sendo preparado. Aguarde alguns instantes.');
  try {
    // Reuse a previous response when Asaas created it but the request response
    // was interrupted, otherwise create one hosted Pix link for this report.
    const externalReference=`${id}:${CHECKOUT_VERSION}`;
    const existing=await api(`/paymentLinks?externalReference=${encodeURIComponent(externalReference)}&limit=100`);
    let link=existing.data?.find((item:any)=>item.externalReference===externalReference && !item.deleted);
    if (!link) link=await api('/paymentLinks', {
      name:'AstroIA — Mapa completo', description:'Mapa astral individual com PDF. Pagamento único, sem assinatura.',
      value:current.amount_cents/100, billingType:'PIX', chargeType:'DETACHED', dueDateLimitDays:1,
      externalReference, notificationEnabled:false, isAddressRequired:false,
      callback:{successUrl:`${SITE_ORIGIN}/#report=${token}&payment=success`,autoRedirect:true},
    });
    if (typeof link.id!=='string' || !link.id || !validUrl(link.url) || Math.round(Number(link.value)*100)!==current.amount_cents) throw new Error('O Asaas retornou um link incompatível com o pedido.');
    await db.batch([
      db.prepare("UPDATE payment_orders SET provider_preference_id=?,provider_status=?,status='pending',updated_at=? WHERE id=? AND status!='approved'").bind(`asaas:${link.id}`,`link_ready_${CHECKOUT_VERSION}`,Date.now(),id),
      db.prepare('UPDATE guest_reports SET order_id=?,checkout_url=? WHERE token_hash=?').bind(id,link.url,hash),
    ]);
    return {orderId:id,checkoutUrl:link.url,amountCents:current.amount_cents};
  } catch(error) {
    await db.prepare("UPDATE payment_orders SET provider_status='link_error',updated_at=? WHERE id=? AND provider_status='creating_link'").bind(Date.now(),id).run();
    throw error;
  }
}

// Called only with an authenticated webhook or an existing, server-owned payment ID.
export async function syncAsaasPayment(paymentId:string, linkHint?:string, externalReference?:string) {
  if (!/^pay_[a-zA-Z0-9_-]+$/.test(paymentId)) throw new Error('Identificador de cobrança inválido.');
  const db=await database();
  const checkoutOrder=typeof externalReference==='string' && /^asaas_[a-f0-9]{64}:/.test(externalReference) ? externalReference.split(':',1)[0] : null;
  const candidate=linkHint ? await db.prepare("SELECT * FROM payment_orders WHERE provider_preference_id=? AND id LIKE 'asaas_%'").bind(`asaas:${linkHint}`).first<Order>() :
    checkoutOrder ? await db.prepare("SELECT * FROM payment_orders WHERE id=? AND provider_preference_id LIKE 'asaas-checkout:%'").bind(checkoutOrder).first<Order>() :
    await db.prepare("SELECT * FROM payment_orders WHERE provider_payment_id=? AND id LIKE 'asaas_%'").bind(`asaas:${paymentId}`).first<Order>();
  if (!candidate) return 'unmatched';
  const payment=await api(`/payments/${encodeURIComponent(paymentId)}`);
  const matchesProvider=candidate.provider_preference_id?.startsWith('asaas-checkout:') ? payment.externalReference?.startsWith(`${candidate.id}:`) : candidate.provider_preference_id===`asaas:${payment.paymentLink}`;
  if (payment.id!==paymentId || !matchesProvider || typeof payment.value!=='number' || Math.round(payment.value*100)!==candidate.amount_cents) return 'mismatch';
  // Never attach an unrelated payment to the same report or reuse one payment for another order.
  const paymentKey=`asaas:${paymentId}`;
  if (candidate.provider_payment_id && candidate.provider_payment_id!==paymentKey) return 'different_payment';
  const paid=['CONFIRMED','RECEIVED'].includes(payment.status) && !payment.deleted && !payment.chargeback && !payment.refunds?.length;
  const reversed=payment.deleted || payment.refunds?.length || ['REFUNDED','REFUND_REQUESTED','REFUND_IN_PROGRESS'].includes(payment.status);
  const chargeback=Boolean(payment.chargeback) || String(payment.status).startsWith('CHARGEBACK');
  const status=chargeback?'chargeback':reversed?'refunded':paid?'approved':'pending';
  if (status==='pending' && !candidate.provider_payment_id) return 'pending';
  await db.prepare(`UPDATE payment_orders SET status=?,provider_status=?,provider_payment_id=?,updated_at=?,approved_at=CASE WHEN ?='approved' THEN COALESCE(approved_at,?) ELSE approved_at END
    WHERE id=? AND (provider_payment_id IS NULL OR provider_payment_id=?) AND (status NOT IN ('refunded','chargeback') OR ? IN ('refunded','chargeback'))`)
    .bind(status,String(payment.status),paymentKey,Date.now(),status,Date.now(),candidate.id,paymentKey,status).run();
  return 'processed';
}
export async function syncAsaasCheckout(checkoutId:string) {
  if (!/^[a-zA-Z0-9_-]{4,255}$/.test(checkoutId)) throw new Error('Identificador de checkout inválido.');
  const db=await database();
  const candidate=await db.prepare("SELECT * FROM payment_orders WHERE provider_preference_id=? AND id LIKE 'asaas_%'").bind(`asaas-checkout:${checkoutId}`).first<Order>();
  if (!candidate) return 'unmatched';
  const checkout=await api(`/checkouts/${encodeURIComponent(checkoutId)}`);
  if (checkout.id!==checkoutId || !String(checkout.externalReference).startsWith(`${candidate.id}:`)) return 'mismatch';
  if (checkout.status!=='PAID') return 'pending';
  await db.prepare(`UPDATE payment_orders SET status='approved',provider_status=?,updated_at=?,approved_at=COALESCE(approved_at,?)
    WHERE id=? AND provider_preference_id=? AND status NOT IN ('refunded','chargeback')`)
    .bind('PAID',Date.now(),Date.now(),candidate.id,`asaas-checkout:${checkoutId}`).run();
  return 'processed';
}
export async function refreshAsaasOrder(id:string) {
  const current=await order(id);
  if (!current || !id.startsWith('asaas_')) throw new Error('Pedido não encontrado.');
  if (current.provider_preference_id?.startsWith('asaas-checkout:')) await syncAsaasCheckout(current.provider_preference_id.replace('asaas-checkout:',''));
  else if (current.provider_payment_id) await syncAsaasPayment(current.provider_payment_id.replace(/^asaas:/,''));
  else if (current.provider_preference_id) {
    const link=current.provider_preference_id.replace(/^asaas:/,'');
    const events=await (await database()).prepare('SELECT DISTINCT payment_id FROM asaas_webhook_events WHERE payment_link=? ORDER BY received_at DESC LIMIT 10').bind(link).all<{payment_id:string}>();
    for (const event of events.results) await syncAsaasPayment(event.payment_id,link);
  }
  return order(id);
}
