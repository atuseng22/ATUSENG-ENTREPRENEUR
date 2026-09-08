const projectDialog = document.querySelector('#project-dialog');
const projectForm = document.querySelector('#project-form');
const packagePrices = {Starter: {normal:400000,promo:350000}, Professional:{normal:650000,promo:600000}, Premium:{normal:1000000,promo:950000}};
const rupiah = value => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);
let lastPlanButton;
function validateBrief(){
  const fields = [
    ['business','Tuliskan nama usaha. Kolom ini tidak boleh hanya berisi spasi.'],
    ['needs','Ceritakan kebutuhanmu. Kolom ini tidak boleh hanya berisi spasi.']
  ];
  fields.forEach(([name,message])=>{
    const field=projectForm.elements[name];
    field.setCustomValidity(field.value.trim() ? '' : message);
  });
}
function updateQuote(){
  const plan = projectForm.elements.plan.value;
  const price = packagePrices[plan][projectForm.elements.customer.value === 'new' ? 'promo' : 'normal'];
  document.querySelector('.selected-price').textContent = `${rupiah(price)} · pembuatan + domain tahun pertama. Total akhir dikonfirmasi saat konsultasi.`;
  document.querySelector('#whatsapp-fallback').hidden = true;
}
document.querySelectorAll('[data-plan]').forEach(button => button.addEventListener('click',()=>{
  lastPlanButton = button;
  projectForm.elements.plan.value = button.dataset.plan;
  updateQuote();
  projectDialog.showModal();
}));
document.querySelector('.close-dialog').addEventListener('click',()=>projectDialog.close());
projectDialog.addEventListener('close',()=>lastPlanButton?.focus());
projectForm.addEventListener('input',()=>{validateBrief();updateQuote();});
projectForm.addEventListener('submit',event=>{
  event.preventDefault();
  validateBrief();
  document.querySelector('#whatsapp-fallback').hidden=true;
  if(!projectForm.reportValidity())return;
  const values = new FormData(projectForm);
  const plan = values.get('plan');
  const price = packagePrices[plan][values.get('customer') === 'new' ? 'promo' : 'normal'];
  const message = `Halo Fariz, saya ingin konsultasi paket ${plan} ATUSENG ENTREPRENEUR.\n\nNama usaha: ${values.get('business').trim()}\nStatus: ${values.get('customer') === 'new' ? 'Pelanggan baru' : 'Pelanggan lama'}\nHarga paket: ${rupiah(price)}\nDomain: ${values.get('domain')}\nKebutuhan: ${values.get('needs').trim()}\n\nMohon konfirmasi domain, lingkup pekerjaan, kebutuhan tambahan, biaya akhir, dan jadwal sebelum pembayaran.`;
  const destination = 'https://wa.me/6282322796124?text='+encodeURIComponent(message);
  const fallback = document.querySelector('#whatsapp-fallback');
  fallback.href=destination;fallback.hidden=false;
  window.open(destination,'_blank','noopener,noreferrer');
});
